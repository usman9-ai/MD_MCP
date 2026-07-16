import json



def load_users():

    with open(r"D:\Martin Dow\Tableau MCP\Clean Code\backend\app\user.json", "r") as f:
        return json.load(f)
    
def get_user(username: str):

    users = load_users()

    return users.get(username)
