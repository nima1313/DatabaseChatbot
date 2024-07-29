import json

def loadItem(file_path, item):
    with open(file_path, 'r') as file:
        data = json.load(file)
    
    return data.get(item)
