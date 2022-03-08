@app
prog-bundle

@aws
profile kj
region us-west-1

@static
ignore public/dist

@http
get /
get /bundle/*
