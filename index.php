<?php
session_start();
$group = 'GW03';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="ChromaSeek — Smart Multimedia Retrieval Engine">
    <title>ChromaSeek — Smart Multimedia Retrieval</title>

    <!-- CSS Design System -->
    <link rel="stylesheet" href="assets/css/variables.css">
    <link rel="stylesheet" href="assets/css/base.css">
    <link rel="stylesheet" href="assets/css/layout.css">
    <link rel="stylesheet" href="assets/css/components.css">
    <link rel="stylesheet" href="assets/css/animations.css">

    <style>
        .landing-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
            padding: 2rem;
            background: radial-gradient(circle at center, var(--bg-card) 0%, var(--bg-primary) 100%);
        }

        .landing-logo {
            font-size: 5rem;
            margin-bottom: 1rem;
            animation: float 4s ease-in-out infinite;
        }

        .landing-title {
            font-size: 3.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 1rem;
            letter-spacing: -1px;
        }

        .landing-subtitle {
            font-size: 1.25rem;
            color: var(--text-secondary);
            max-width: 600px;
            margin-bottom: 3rem;
            line-height: 1.6;
        }

        .landing-buttons {
            display: flex;
            gap: 1.5rem;
            flex-wrap: wrap;
            justify-content: center;
        }

        .btn-launch {
            font-size: 1.1rem;
            padding: 0.8rem 2rem;
            background: var(--accent-blue);
            color: white;
            border: none;
            border-radius: var(--radius-xl);
            cursor: pointer;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(56, 189, 248, 0.4);
        }

        .btn-launch:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(56, 189, 248, 0.6);
            background: #4cc7ff;
        }

        .btn-about {
            font-size: 1.1rem;
            padding: 0.8rem 2rem;
            background: transparent;
            color: var(--text-main);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: var(--radius-xl);
            cursor: pointer;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .btn-about:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.4);
        }

        /* Back to Dashboard Button */
        .btn-back {
            position: fixed;
            top: 1.5rem;
            left: 1.5rem;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 0.6rem 1.4rem;
            background: rgba(255, 255, 255, 0.06);
            color: var(--text-secondary, #94a3b8);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            cursor: pointer;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.95rem;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            z-index: 100;
        }

        .btn-back:hover {
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(255, 255, 255, 0.25);
            color: white;
            transform: translateX(-3px);
        }

        .btn-back svg {
            width: 18px;
            height: 18px;
            transition: transform 0.3s ease;
        }

        .btn-back:hover svg {
            transform: translateX(-3px);
        }

        /* Group Badge */
        .group-badge {
            position: fixed;
            top: 1.5rem;
            right: 1.5rem;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 0.5rem 1.2rem;
            background: rgba(56, 189, 248, 0.08);
            border: 1px solid rgba(56, 189, 248, 0.25);
            border-radius: 10px;
            color: var(--accent-blue, #38bdf8);
            font-weight: 700;
            font-size: 0.95rem;
            letter-spacing: 1px;
            backdrop-filter: blur(10px);
            z-index: 100;
        }

        /* Float Animation */
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0px); }
        }
    </style>
</head>
<body>

    <!-- Back to Madam's Dashboard -->
    <a href="../../dashboard.php?group=<?php echo urlencode($group); ?>" class="btn-back">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Dashboard
    </a>

    <!-- Group Badge -->
    <div class="group-badge">
        GROUP: <?php echo htmlspecialchars($group); ?>
    </div>

    <div class="landing-container">
        <div class="animate-slideUp" style="animation-delay: 0.1s">
            <div class="landing-logo">🎨</div>
        </div>
        <div class="animate-slideUp" style="animation-delay: 0.2s">
            <h1 class="landing-title">ChromaSeek</h1>
        </div>
        <div class="animate-slideUp" style="animation-delay: 0.3s">
            <p class="landing-subtitle">
                A state-of-the-art multimedia retrieval system powering TBR, CBR, and ABR searches. Experience advanced feature extraction, K-Means clustering, and intelligent heuristic image analysis in real-time.
            </p>
        </div>
        <div class="landing-buttons animate-slideUp" style="animation-delay: 0.4s">
            <a href="app.html" class="btn-launch">🚀 Launch Application</a>
            <a href="about.html" class="btn-about">ℹ️ How It Works</a>
        </div>
    </div>

</body>
</html>
