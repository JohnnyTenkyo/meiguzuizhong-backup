module.exports = {
  apps: [
    {
      name: "usgb",
      cwd: "/var/www/usgb",
      script: "dist/index.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3005",
      },
    },
    {
      name: "usgb-twitter",
      cwd: "/var/www/usgb",
      script: "server/twitter_service.py",
      interpreter: "python3",
      instances: 1,
      exec_mode: "fork",
      env: {
        PYTHONUNBUFFERED: "1",
      },
    },
  ],
};
