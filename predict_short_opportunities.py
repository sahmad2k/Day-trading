"""Predict short opportunities across multiple equities.

This module downloads historical daily price data with yfinance, engineers
momentum/volatility features, labels potential short opportunities and trains a
RandomForest model with time-series cross validation.  Results, including the
last fold's classification report and feature importance plot, are printed to
stdout / saved locally.

Usage
-----
python predict_short_opportunities.py --tickers AAPL MSFT --start 2015-01-01 --end 2024-01-01
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Sequence

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import TimeSeriesSplit


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Download historical OHLCV data, engineer technical features, label\n"
            "short opportunities (>=3% drop in next 5 trading days), and train\n"
            "a RandomForestClassifier with time-series cross validation."
        )
    )
    parser.add_argument(
        "--tickers",
        nargs="+",
        default=["AAPL", "MSFT", "TSLA", "AMZN", "META"],
        help="List of ticker symbols to download",
    )
    parser.add_argument(
        "--start",
        default="2015-01-01",
        help="Start date for yfinance download (YYYY-MM-DD)",
    )
    parser.add_argument(
        "--end",
        default="2024-01-01",
        help="End date for yfinance download (YYYY-MM-DD)",
    )
    parser.add_argument(
        "--splits",
        type=int,
        default=5,
        help="Number of TimeSeriesSplit folds",
    )
    parser.add_argument(
        "--n-estimators",
        type=int,
        default=400,
        help="Number of trees for RandomForestClassifier",
    )
    parser.add_argument(
        "--min-samples-leaf",
        type=int,
        default=5,
        help="Minimum samples per leaf for RandomForestClassifier",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("outputs"),
        help="Directory to store generated charts",
    )
    return parser.parse_args()


def _flatten_columns(columns: pd.Index) -> List[str]:
    flat: List[str] = []
    for col in columns:
        if isinstance(col, tuple):
            # MultiIndex from yfinance -> keep the price key
            primary = col[0] if col[0] else col[1]
            flat.append(primary)
        else:
            flat.append(col)
    return flat


def download_data(tickers: Sequence[str], start: str, end: str) -> pd.DataFrame:
    frames: List[pd.DataFrame] = []
    for ticker in tickers:
        print(f"Downloading {ticker}...")
        df = yf.download(ticker, start=start, end=end, progress=False)
        if df.empty:
            print(f"Warning: no data returned for {ticker} – skipping")
            continue
        df = df.rename_axis("date").reset_index()
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = _flatten_columns(df.columns)
        df["symbol"] = ticker
        frames.append(df)
    if not frames:
        raise RuntimeError("No price data downloaded. Check ticker list or dates.")
    combined = pd.concat(frames)
    return combined.sort_values(["symbol", "date"]).reset_index(drop=True)


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    grouped_close = out.groupby("symbol")["Close"]
    out["return_1d"] = grouped_close.pct_change(1)
    out["return_5d"] = grouped_close.pct_change(5)
    out["ma_10"] = grouped_close.transform(lambda s: s.rolling(10).mean())
    out["ma_50"] = grouped_close.transform(lambda s: s.rolling(50).mean())

    out["volatility_10"] = (
        out.groupby("symbol")["return_1d"].transform(lambda s: s.rolling(10).std())
    )

    # Label: drop >= 3% within the next 5 trading days
    future_min = grouped_close.transform(lambda s: s.shift(-1).rolling(5).min())
    drop_ratio = (out["Close"] - future_min) / out["Close"]
    out["short_label"] = (drop_ratio >= 0.03).astype(int)
    return out


def prepare_dataset(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    feature_cols = ["return_1d", "return_5d", "volatility_10", "ma_10", "ma_50"]
    filtered = df.dropna(subset=feature_cols + ["short_label"]).copy()
    X = filtered[feature_cols]
    y = filtered["short_label"].astype(int)
    return X, y


@dataclass
class FoldResult:
    fold: int
    accuracy: float
    report: str


def train_model(X: pd.DataFrame, y: pd.Series, args: argparse.Namespace):
    tscv = TimeSeriesSplit(n_splits=args.splits)
    fold_results: List[FoldResult] = []
    best_model: RandomForestClassifier | None = None
    best_fold_idx: int | None = None
    best_acc = -np.inf

    for fold_idx, (train_idx, test_idx) in enumerate(tscv.split(X), start=1):
        model = RandomForestClassifier(
            n_estimators=args.n_estimators,
            min_samples_leaf=args.min_samples_leaf,
            random_state=42,
            class_weight="balanced_subsample",
            n_jobs=-1,
        )
        model.fit(X.iloc[train_idx], y.iloc[train_idx])
        preds = model.predict(X.iloc[test_idx])
        acc = accuracy_score(y.iloc[test_idx], preds)
        report = classification_report(
            y.iloc[test_idx], preds, target_names=["No Short", "Short"], zero_division=0
        )
        fold_results.append(FoldResult(fold_idx, acc, report))
        if acc > best_acc:
            best_acc = acc
            best_model = model
            best_fold_idx = fold_idx

    assert best_model is not None and best_fold_idx is not None
    return best_model, fold_results, best_fold_idx


def plot_feature_importance(model: RandomForestClassifier, feature_names: Sequence[str], output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)
    importances = model.feature_importances_
    order = np.argsort(importances)
    plt.figure(figsize=(8, 4))
    plt.barh(np.array(feature_names)[order], importances[order], color="#f57c00")
    plt.title("Random Forest Feature Importance")
    plt.xlabel("Importance")
    plt.tight_layout()
    output_path = output_dir / "feature_importance.png"
    plt.savefig(output_path, dpi=150)
    plt.close()
    print(f"Saved feature importance chart to {output_path}")


def main():
    args = parse_args()
    raw = download_data(args.tickers, args.start, args.end)
    enriched = engineer_features(raw)
    X, y = prepare_dataset(enriched)

    print(f"Total samples after feature engineering: {len(X):,}")
    if len(X) == 0:
        raise RuntimeError("Not enough samples to train the model.")

    model, fold_results, best_fold_idx = train_model(X, y, args)

    print("\nCross-validation results:")
    for res in fold_results:
        print(f"Fold {res.fold}: accuracy={res.accuracy:.3f}")
    best = next(res for res in fold_results if res.fold == best_fold_idx)
    print("\nBest fold classification report:")
    print(best.report)

    plot_feature_importance(model, list(X.columns), args.output_dir)


if __name__ == "__main__":
    main()
