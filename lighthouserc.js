// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      // Toujours auditer le build de prod, pas `next dev`
      startServerCommand: "next start -p 3001",
      startServerReadyPattern: "started server on",
      url: [
        "http://localhost:3001/",
        "http://localhost:3001/games",
        "http://localhost:3001/games/champions",
        "http://localhost:3001/games/chrono",
        "http://localhost:3001/a-propos",
        "http://localhost:3001/legal/mentions-legales",
        "http://localhost:3001/legal/confidentialite",
        "http://localhost:3001/cookies",
      ],
      numberOfRuns: 3, // médiane plus stable
    },
    assert: {
      // Seuils : durcissez-les à votre rythme
      assertions: {
        "categories:performance": ["warn", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 1 }],
        "categories:seo": ["error", { minScore: 1 }],
        "categories:accessibility": ["warn", { minScore: 1 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./.lighthouse",
      reportFilenamePattern: "lh-report-%%PATHNAME%%-%%DATETIME%%.html",
    },
  },
};
