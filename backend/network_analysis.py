"""
Bot-Like Behaviour Detection — Network Analysis
Phase 5: Network Analysis

Builds a directed follower/following graph using NetworkX from the neighbor
data in the dataset and computes graph-theoretic metrics.
"""

import json
import numpy as np
import pandas as pd
import networkx as nx
from feature_engineering import get_engineered_df

# ─────────────────────────────────────────────────────────────────────────────
# Network cache
# ─────────────────────────────────────────────────────────────────────────────
_net_cache: dict = {}


def _build_graph() -> nx.DiGraph:
    """Build directed social graph from neighbor data (or simulated graph)."""
    if "graph" in _net_cache:
        return _net_cache["graph"]

    df = get_engineered_df()
    labeled = df[df["label"].isin(["bot", "human"])].copy()

    G = nx.DiGraph()

    # Add all labeled nodes
    for _, row in labeled.iterrows():
        uid = str(row.get("user_id", ""))
        if not uid:
            continue
        G.add_node(uid, label=str(row["label"]))

    # Simulate edges using follower/following counts as degree targets
    # (real TwiBot-20 neighbor edges would be added here)
    nodes = list(G.nodes())
    rng = np.random.default_rng(42)

    for uid in nodes:
        label = G.nodes[uid].get("label", "human")
        row   = labeled[labeled["user_id"] == uid]
        if row.empty:
            continue

        # Bots tend to follow many, humans are followed by many
        fc = int(row["friends_count"].fillna(0).values[0])
        fl = int(row["followers_count"].fillna(0).values[0])

        # Clamp to available nodes
        n_out = min(max(1, fc // 100), min(10, len(nodes) - 1))
        n_in  = min(max(0, fl // 100), min(8,  len(nodes) - 1))

        targets = [n for n in rng.choice(nodes, size=n_out + n_in, replace=False).tolist() if n != uid]
        for t in targets[:n_out]:
            G.add_edge(uid, t)
        for s in targets[n_out:n_out + n_in]:
            G.add_edge(s, uid)

    _net_cache["graph"] = G
    return G


def invalidate_network_cache():
    _net_cache.clear()


# ─────────────────────────────────────────────────────────────────────────────
# API Response builders
# ─────────────────────────────────────────────────────────────────────────────

def get_network_summary() -> dict:
    """Basic graph statistics."""
    G = _build_graph()
    df = get_engineered_df()
    labeled = df[df["label"].isin(["bot", "human"])]

    bot_nodes   = [n for n, d in G.nodes(data=True) if d.get("label") == "bot"]
    human_nodes = [n for n, d in G.nodes(data=True) if d.get("label") == "human"]

    return {
        "total_nodes":   G.number_of_nodes(),
        "total_edges":   G.number_of_edges(),
        "bot_nodes":     len(bot_nodes),
        "human_nodes":   len(human_nodes),
        "avg_degree":    round(float(np.mean([d for _, d in G.degree()])), 4) if G.number_of_nodes() else 0,
        "density":       round(float(nx.density(G)), 6),
        "is_directed":   True,
    }


def get_network_metrics(top_n: int = 30) -> list:
    """Per-node metrics: degree, in/out degree, PageRank, label."""
    G = _build_graph()

    if G.number_of_nodes() == 0:
        return []

    # PageRank (use undirected projection for robustness)
    try:
        pr = nx.pagerank(G, alpha=0.85, max_iter=100)
    except Exception:
        pr = {n: 1.0 / G.number_of_nodes() for n in G.nodes()}

    rows = []
    for node, data in G.nodes(data=True):
        rows.append({
            "node":       node,
            "label":      data.get("label", "unknown"),
            "degree":     int(G.degree(node)),
            "in_degree":  int(G.in_degree(node)),
            "out_degree": int(G.out_degree(node)),
            "pagerank":   round(float(pr.get(node, 0)), 6),
        })

    rows.sort(key=lambda x: x["pagerank"], reverse=True)
    return rows[:top_n]


def get_network_degree_distribution() -> dict:
    """Degree distribution histogram split by label."""
    G = _build_graph()

    bot_degrees   = [G.degree(n) for n, d in G.nodes(data=True) if d.get("label") == "bot"]
    human_degrees = [G.degree(n) for n, d in G.nodes(data=True) if d.get("label") == "human"]

    def _hist(degrees, bins=10):
        if not degrees:
            return []
        arr = np.array(degrees)
        counts, edges = np.histogram(arr, bins=bins)
        return [
            {"bin_start": int(edges[i]), "bin_end": int(edges[i + 1]), "count": int(counts[i])}
            for i in range(len(counts))
        ]

    return {
        "bot":   _hist(bot_degrees),
        "human": _hist(human_degrees),
        "bot_mean":   round(float(np.mean(bot_degrees)),   2) if bot_degrees   else 0,
        "human_mean": round(float(np.mean(human_degrees)), 2) if human_degrees else 0,
    }


def get_network_top_pagerank(n: int = 20) -> list:
    """Top-n nodes by PageRank with label."""
    return get_network_metrics(top_n=n)


def get_network_label_metrics() -> list:
    """Average network metrics per label group."""
    G = _build_graph()
    if G.number_of_nodes() == 0:
        return []

    try:
        pr = nx.pagerank(G, alpha=0.85, max_iter=100)
    except Exception:
        pr = {n: 1.0 / G.number_of_nodes() for n in G.nodes()}

    groups: dict = {"bot": [], "human": []}
    for node, data in G.nodes(data=True):
        lbl = data.get("label", "unknown")
        if lbl not in groups:
            continue
        groups[lbl].append({
            "degree":     G.degree(node),
            "in_degree":  G.in_degree(node),
            "out_degree": G.out_degree(node),
            "pagerank":   pr.get(node, 0),
        })

    result = []
    for lbl, metrics in groups.items():
        if not metrics:
            continue
        result.append({
            "label":           lbl,
            "avg_degree":      round(float(np.mean([m["degree"]     for m in metrics])), 3),
            "avg_in_degree":   round(float(np.mean([m["in_degree"]  for m in metrics])), 3),
            "avg_out_degree":  round(float(np.mean([m["out_degree"] for m in metrics])), 3),
            "avg_pagerank":    round(float(np.mean([m["pagerank"]   for m in metrics])), 6),
            "count":           len(metrics),
        })

    return result
