#!/bin/bash

# Add local bin to PATH
export PATH="/home/appuser/.local/bin:$PATH"

# Run Streamlit app
streamlit run app.py --server.headless=true --server.port=8501 --server.address=0.0.0.0
