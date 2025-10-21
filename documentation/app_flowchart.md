flowchart TD
    S[Start] --> A[Login Page]
    A -->|Valid Credentials| B[Auth Check]
    A -->|Create Account| U[Sign Up Page]
    U --> A
    B -->|Success| C[Dashboard]
    B -->|Failure| A
    C --> D[Add Trade Button]
    D --> E[Trade Form Modal]
    E --> F[Upload Screenshot API]
    F --> G[Return Screenshot URL]
    G --> H[Create Trade API]
    H --> I[Save Trade in DB]
    I --> J[Refresh Dashboard]
    J --> C