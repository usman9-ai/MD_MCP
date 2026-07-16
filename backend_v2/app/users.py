import json
import os

USER_FILE = os.path.join(os.path.dirname(__file__), "user.json")


def load_users():

    with open(USER_FILE, "r") as f:
        return json.load(f)

def get_user(username: str):

    users = load_users()

    # Look up by the "username" field (the same field /login authenticates
    # against), not by the top-level JSON key. The JSON key (e.g. "user1")
    # is just a record id and is not guaranteed to match the username.
    for user in users.values():

        if user.get("username") == username:

            return user

    return None
