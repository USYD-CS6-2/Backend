from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok", "message": "server is running on ubuntu"}

@app.post("/analyze")
def analyze():
    return {
        "status": "success",
        "message": "stub response",
        "data": {
            "summary": "This is a placeholder summary."
        }
    }
