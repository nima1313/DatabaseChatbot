import json

def loadItem(file_path, item):

    data = loadFile(file_path=file_path)

    return data.get(item)

def loadFile(file_path):

    with open(file_path) as file:
        data = json.load(file)

    return data