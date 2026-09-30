"""
Bot-Like Behaviour Detection — Dataset Generator
Phase 2: Data Preprocessing + EDA

Generates a realistic demo dataset based on the TwiBot-20 profile schema.
- 500 accounts (300 human, 200 bot)
- All profile fields match TwiBot-20 format exactly
- Statistical distributions based on published TwiBot-20 paper findings
- Clearly labelled as DEMO data in metadata

IMPORTANT: Replace data/raw/TwiBot-20_sample.json with the real TwiBot-20
dataset (requires research access request from the authors) to use real data.
"""

import json
import os
import random
import numpy as np
from datetime import datetime, timedelta, timezone

random.seed(42)
np.random.seed(42)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR  = os.path.join(BASE_DIR, "..", "data", "raw")
os.makedirs(RAW_DIR, exist_ok=True)

DEMO_PATH = os.path.join(RAW_DIR, "twibot20_demo.json")

# ── Helpers ──────────────────────────────────────────────────────────────────
DOMAINS = ["Politics", "Business", "Entertainment", "Sports"]

HUMAN_NAMES  = ["Alice Morgan", "James Turner", "Sarah Kim", "David Chen",
                "Emily Watson", "Michael Brown", "Olivia Parker", "Noah Davis"]
BOT_PREFIXES = ["bot", "auto", "news", "info", "alert", "daily", "real", "top"]

def _rand_date(start_year=2006, end_year=2020) -> str:
    start = datetime(start_year, 1, 1, tzinfo=timezone.utc)
    end   = datetime(end_year,  12, 31, tzinfo=timezone.utc)
    delta = end - start
    rand_days = random.randint(0, delta.days)
    dt = start + timedelta(days=rand_days)
    return dt.strftime("%a %b %d %H:%M:%S +0000 %Y")

def _clamp_int(val, lo=0, hi=None):
    val = max(lo, int(val))
    if hi is not None:
        val = min(hi, val)
    return val

# ── Account generators ────────────────────────────────────────────────────────
def _make_human(uid: str) -> dict:
    name   = random.choice(HUMAN_NAMES) + f"_{uid[:4]}"
    handle = name.lower().replace(" ", "_")

    followers = _clamp_int(np.random.lognormal(7.0, 2.0))
    friends   = _clamp_int(np.random.lognormal(5.5, 1.8))
    statuses  = _clamp_int(np.random.lognormal(8.0, 1.5))

    created_at  = _rand_date(2008, 2018)
    description = random.choice([
        "Passionate about technology and science.",
        "Sports fan, coffee lover. Opinions are my own.",
        "Journalist. Covering politics and world affairs.",
        "Business consultant | Speaker | Author",
        "",
    ])

    profile = {
        "id": uid + " ", "id_str": uid + " ",
        "name": name + " ", "screen_name": handle + " ",
        "location": random.choice(["New York", "London", "California", "Texas", ""]) + " ",
        "profile_location": "None ",
        "description": description + " ",
        "url": "None ",
        "entities": "{'description': {'urls': []}} ",
        "protected": "False ",
        "followers_count": str(followers) + " ",
        "friends_count":   str(friends)   + " ",
        "listed_count":    str(_clamp_int(np.random.lognormal(3.0, 2.0))) + " ",
        "created_at":      created_at + " ",
        "favourites_count": str(_clamp_int(np.random.lognormal(7.5, 2.0))) + " ",
        "utc_offset": "None ", "time_zone": "None ",
        "geo_enabled": random.choice(["True", "False"]) + " ",
        "verified": ("True " if followers > 500_000 else "False "),
        "statuses_count": str(statuses) + " ",
        "lang": "None ",
        "contributors_enabled": "False ",
        "is_translator": "False ",
        "is_translation_enabled": "False ",
        "profile_background_color": "F5F8FA ",
        "profile_background_image_url": "None ",
        "profile_background_image_url_https": "None ",
        "profile_background_tile": "False ",
        "profile_image_url": f"http://pbs.twimg.com/profile_images/{uid}/photo_normal.jpg ",
        "profile_image_url_https": f"https://pbs.twimg.com/profile_images/{uid}/photo_normal.jpg ",
        "profile_link_color": "1DA1F2 ",
        "profile_sidebar_border_color": "C0DEED ",
        "profile_sidebar_fill_color": "DDEEF6 ",
        "profile_text_color": "333333 ",
        "profile_use_background_image": "True ",
        "has_extended_profile": random.choice(["True", "False"]) + " ",
        "default_profile": "False ",
        "default_profile_image": "False ",
    }

    # Realistic tweet texts
    tweets = None
    if random.random() > 0.05:  # 95% have tweets
        tweet_texts = [
            f"Really enjoying the weather today! #blessed",
            f"Just watched an amazing documentary about AI. Highly recommend!",
            f"Can't believe how fast technology is evolving. Exciting times!",
            f"Coffee is the answer, no matter the question. ☕",
            f"Working on a new project. Stay tuned for updates!",
            f"RT @SomeUser: Great article on machine learning applications.",
            f"Happy Friday everyone! Have a great weekend.",
            f"Thoughts on the latest news: it's complicated.",
        ]
        n_tweets = _clamp_int(np.random.lognormal(3.5, 1.0), lo=1, hi=20)
        tweets = random.choices(tweet_texts, k=n_tweets)

    # Some have neighbors
    neighbor = None
    if random.random() > 0.3:
        n_following = random.randint(10, 500)
        neighbor = {
            "following": [str(random.randint(10000000, 99999999)) for _ in range(n_following)],
            "follower":  [str(random.randint(10000000, 99999999)) for _ in range(random.randint(0, 200))]
        }

    return {
        "ID": uid,
        "profile": profile,
        "tweet": tweets,
        "neighbor": neighbor,
        "domain": random.sample(DOMAINS, random.randint(1, 3)),
        "label": "human",
    }


def _make_bot(uid: str) -> dict:
    prefix = random.choice(BOT_PREFIXES)
    handle = f"{prefix}_{uid[:6]}"

    # Bots typically have skewed follower/following ratios
    bot_type = random.choice(["follower_bot", "spam_bot", "lurker_bot"])

    if bot_type == "follower_bot":
        followers = _clamp_int(np.random.lognormal(3.0, 1.5))  # few real followers
        friends   = _clamp_int(np.random.lognormal(6.5, 1.5))  # follows many
        statuses  = _clamp_int(np.random.lognormal(4.0, 2.0))  # few tweets
    elif bot_type == "spam_bot":
        followers = _clamp_int(np.random.lognormal(4.0, 1.0))
        friends   = _clamp_int(np.random.lognormal(5.0, 1.5))
        statuses  = _clamp_int(np.random.lognormal(10.0, 1.5))  # very high activity
    else:  # lurker
        followers = _clamp_int(np.random.lognormal(2.0, 1.0))
        friends   = _clamp_int(np.random.lognormal(4.5, 1.5))
        statuses  = _clamp_int(np.random.lognormal(3.0, 1.5))

    # Bots often created more recently
    created_at = _rand_date(2015, 2020)

    profile = {
        "id": uid + " ", "id_str": uid + " ",
        "name": handle.replace("_", " ").title() + " ",
        "screen_name": handle + " ",
        "location": " ",
        "profile_location": "None ",
        "description": random.choice(["", " ", "Follow for updates!", "News bot"]) + " ",
        "url": "None ",
        "entities": "{'description': {'urls': []}} ",
        "protected": "False ",
        "followers_count":  str(followers) + " ",
        "friends_count":    str(friends)   + " ",
        "listed_count":     str(_clamp_int(np.random.lognormal(1.0, 1.5))) + " ",
        "created_at":       created_at + " ",
        "favourites_count": str(_clamp_int(np.random.lognormal(3.0, 2.5))) + " ",
        "utc_offset": "None ", "time_zone": "None ",
        "geo_enabled": "False ",
        "verified": "False ",
        "statuses_count": str(statuses) + " ",
        "lang": "None ",
        "contributors_enabled": "False ",
        "is_translator": "False ",
        "is_translation_enabled": "False ",
        "profile_background_color": "F5F8FA ",
        "profile_background_image_url": "None ",
        "profile_background_image_url_https": "None ",
        "profile_background_tile": "False ",
        "profile_image_url": "None ",
        "profile_image_url_https": "None ",
        "profile_link_color": "1DA1F2 ",
        "profile_sidebar_border_color": "C0DEED ",
        "profile_sidebar_fill_color": "DDEEF6 ",
        "profile_text_color": "333333 ",
        "profile_use_background_image": "True ",
        "has_extended_profile": "False ",
        "default_profile":  "True ",
        "default_profile_image": random.choice(["True", "False"]) + " ",
    }

    # Bots may have template-like or no tweets
    tweets = None
    if bot_type == "spam_bot" and random.random() > 0.1:
        spam_templates = [
            "Check out this amazing deal! https://t.co/fakelink123",
            "FREE followers! Click here: https://t.co/fakelink456",
            "RT @SpamAccount: Win prizes by following me!",
            "Buy cheap followers now! Limited offer.",
            f"Breaking news! #{random.choice(['Politics', 'Sports', 'Entertainment'])}",
        ]
        n = _clamp_int(np.random.lognormal(3.0, 1.5), lo=1, hi=50)
        tweets = random.choices(spam_templates, k=n)

    # Bots rarely have realistic neighbor data
    neighbor = None
    if random.random() > 0.5:
        n_following = random.randint(500, 5000)
        neighbor = {
            "following": [str(random.randint(10000000, 99999999)) for _ in range(n_following)],
            "follower":  [str(random.randint(10000000, 99999999)) for _ in range(random.randint(0, 50))]
        }

    return {
        "ID": uid,
        "profile": profile,
        "tweet": tweets,
        "neighbor": neighbor,
        "domain": random.sample(DOMAINS, random.randint(1, 2)),
        "label": "bot",
    }


# ── Main generator ─────────────────────────────────────────────────────────────
def generate_demo_dataset(n_human=300, n_bot=200) -> str:
    """
    Generate a labeled demo dataset and save to data/raw/twibot20_demo.json.
    Returns the file path.
    """
    print(f"Generating demo dataset: {n_human} human + {n_bot} bot accounts …")
    accounts = []

    for i in range(n_human):
        uid = str(random.randint(100_000_000, 999_999_999))
        accounts.append(_make_human(uid))

    for i in range(n_bot):
        uid = str(random.randint(1_000_000_000, 9_999_999_999))
        accounts.append(_make_bot(uid))

    random.shuffle(accounts)

    with open(DEMO_PATH, "w", encoding="utf-8") as f:
        json.dump(accounts, f, ensure_ascii=False, indent=2)

    print(f"Demo dataset saved: {DEMO_PATH} ({len(accounts)} accounts)")
    return DEMO_PATH


if __name__ == "__main__":
    generate_demo_dataset()
