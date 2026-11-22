# DATABASE - MYSQL

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.getenv("DB_NAME", "main"),
        "USER": os.getenv("DB_USER", ""),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", ""),
        "PORT": os.getenv("DB_PORT", "3306"),
        "CONN_MAX_AGE": 0,
        "OPTIONS": {
            "charset": "utf8mb4",
            "connect_timeout": 10,
            "ssl": {
                "ca": "/etc/ssl/certs/ca-certificates.crt"
            },
            "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    }
}
