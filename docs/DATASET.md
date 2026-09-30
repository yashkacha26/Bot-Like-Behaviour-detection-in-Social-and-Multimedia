# Dataset: TwiBot-20

## Overview
The primary dataset for this project is **TwiBot-20**, a comprehensive benchmark designed for Twitter bot detection. It provides multi-modal information covering semantic, property, and neighborhood aspects to properly evaluate detection models.

## Dataset Structure
The dataset organizes information for each user into three primary categories:

### 1. Property Information (User Features)
These are profile metadata elements extracted from the Twitter API. They are typically structured as:
*   `followers_count`: Number of followers.
*   `following_count`: Number of users this account is following.
*   `tweet_count`: Total number of tweets.
*   `created_at`: Account age/creation date.
*   `verified`: Boolean indicating verification status.
*   `description`: The user's biography text.

### 2. Semantic Information (Text)
*   **Availability**: YES.
*   Contains the text content of the user's recent tweets (typically up to 200 tweets). This will allow us to proceed with our planned NLP analysis (TF-IDF, Sentiment, WordCloud).

### 3. Neighborhood Information (Network)
*   **Availability**: YES.
*   Represents the graph structure of the Twitter network, consisting of edges detailing follower-following relationships among users. This allows us to perform Graph/Network Analysis (Degree, PageRank, etc.).

## Labels
The dataset provides a binary classification label for each user:
*   **`1`**: Indicates a **bot**.
*   **`0`**: Indicates a **human** (genuine user).

## Dataset Source
*   TwiBot-20 dataset is generally provided in JSON format (e.g., `TwiBot-20_sample.json`).
*   Due to Twitter privacy policies, researchers must usually request access directly from the authors. 
*   If we cannot obtain the full dataset, we will use the provided public sample or an alternative like `botometer-feedback-2019` or `cresci-2017`, noting the substitution here.

## Assumptions
*   We do not invent missing columns, labels, or network relationships.
*   Our pipeline will gracefully handle the data as it is strictly provided in the benchmark format.

---

## Phase 2 Status

The TwiBot-20 **public sample** (100 accounts) contains **no label field** — it cannot be used for supervised classification. The full dataset (with labels) requires a research access request from the authors.

**Decision (Phase 2):** A realistic demo dataset (`data/raw/twibot20_demo.json`) is auto-generated using the exact TwiBot-20 JSON schema and statistically-motivated distributions published in the TwiBot-20 paper. This is clearly marked as demo data throughout the application.

**To switch to real data:** Place the full TwiBot-20 dataset (with `label` field per entry) at:
```
data/raw/TwiBot-20_sample.json
```
The application will automatically detect it and switch to using real data — no code changes needed.

**Demo dataset characteristics:**
- 500 accounts (300 human, 200 bot)
- Exact TwiBot-20 profile schema
- Statistically realistic distributions for followers, friends, statuses, account age
- Text data (tweets) and network data (neighbors) included
- Binary labels: `"bot"` / `"human"`

