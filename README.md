
<p align="center">
  <img src="public/media/logo.png" width="500" alt="LBXD Story Generator logo">
</p>

<h1 align="center">LBXD Story Generator</h1>

<p align="center">
  Create Letterboxd-style Stories for Instagram in seconds.<br>
  Pick a movie, set your rating, download a ready-to-post 1080 × 1920 image.
</p>

<p align="center">
  <a href="https://lbxdstorygenerator.netlify.app">
    <img src="https://img.shields.io/badge/Website-Visit%20LBXD-00c7b7?style=for-the-badge&logo=netlify&logoColor=white" alt="Website">
  </a>
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/HTML-CSS-JavaScript-orange?style=for-the-badge" alt="HTML CSS JavaScript">
  <img src="https://img.shields.io/badge/Export-1080x1920-00c853?style=for-the-badge" alt="1080x1920">
  <img src="https://img.shields.io/badge/Deploy-Netlify-00c7b7?style=for-the-badge&logo=netlify&logoColor=white" alt="Netlify">
</p>

<p align="center">
  <a href="https://github.com/DavidFerreiro-dev">GitHub</a> ·
  <a href="https://letterboxd.com/Deybidd/">Letterboxd</a> ·
  <a href="https://lbxdstorygenerator.netlify.app">Website</a>
</p>

---

## Features

- **Live movie search** with poster, year and synopsis for each result.
- **Your own rating**: 0.5 to 5 green stars, half stars included. It is never taken from TMDB.
- **Editable title**: switch between the English and original title, or type anything you like. Long titles shrink and wrap on their own.
- **Optional elements**: Letterboxd branding, the colored dots and the "ON" divider.
- **Look controls**: background gradient intensity, poster width and TMDB image size (up to the original file).
- **Real export**: PNG or JPG at exactly **1080 × 1920 px**. JPG quality is adjustable (95% by default).
- **What you see is what you get**: the preview is the same canvas used for the export, only scaled with CSS.
- **No dependencies and no build step**: plain HTML, CSS and JavaScript.

## Live Demo

<p align="center">
  <a href="https://lbxdstorygenerator.netlify.app">
    <img src="https://img.shields.io/badge/OPEN%20LBXD%20STORY%20GENERATOR-00c7b7?style=for-the-badge&logo=netlify&logoColor=white" alt="Open LBXD Story Generator">
  </a>
</p>

Try it here:

**https://lbxdstorygenerator.netlify.app**

## Quick Start

Requires [Node.js](https://nodejs.org) 18 or newer.

```bash
npm start
```

Open **http://localhost:3000**, search for a movie and download your image.

> Do not open `index.html` by double-clicking it: the app needs to be served over HTTP (that is what `npm start` does).

## Configuration

The TMDB key lives in [`public/config.json`](public/config.json):

```json
{
  "tmdbKey": "YOUR_TMDB_KEY"
}
```

Both the **API Read Access Token (v4)** and the **API Key (v3)** work. You can get either for free at [themoviedb.org](https://www.themoviedb.org/settings/api).

Because the app runs entirely in the browser, the key is visible to anyone who inspects the site. Use a read-only key and, if it ever leaks, regenerate it in your TMDB settings and update `config.json`.

## Deploy

LBXD Story Generator is a static web application and can be deployed to any static hosting provider.

### Deploy to Netlify

<p align="center">
  <a href="https://app.netlify.com/start/deploy?repository=https://github.com/DavidFerreiro-dev/LBXD-Story-Generator">
    <img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify">
  </a>
</p>

1. Click the **Deploy to Netlify** button.
2. Connect your GitHub account.
3. Select the repository.
4. Configure the deployment settings:
   - **Build command:** Leave empty.
   - **Publish directory:** `public`.
5. Deploy your site.

Make sure `public/config.json` contains your TMDB API key before deploying.

### Other hosting providers

| Host | Configuration |
| --- | --- |
| **Netlify** | Publish directory: `public` |
| **Vercel** | Configured through `vercel.json` |
| **GitHub Pages / any static host** | Publish the contents of `public/` |

## Customize

Replace these files in `public/media/` with your own, keeping the names:

| File | Use |
| --- | --- |
| `lbxd_dots.png` | Dots drawn next to the "Letterboxd" text in the image. Transparent PNG; it is scaled to a fixed height and keeps its proportions. If missing, three drawn circles are used. |
| `favicon.png` | Browser tab icon. |
| `logo.png` | Logo shown in this README. |

## How It Works

1. The app reads `config.json` and queries the TMDB API (`search/movie` and `movie/{id}`) directly from the browser, with a short debounce while you type.
2. When you pick a movie, it loads the poster from `image.tmdb.org` with CORS enabled, so the canvas can be exported safely.
3. Everything is painted onto a 1080 × 1920 `<canvas>`: gradient background with grain, poster with rounded corners and shadow, title, stars, divider and branding.
4. **Download** waits for fonts and poster to be ready, repaints the canvas and saves it with `canvas.toBlob`. The file is named `letterboxd-story-<movie>.png|jpg`.

## Troubleshooting

| Message | What to do |
| --- | --- |
| *TMDB key missing* | Add your key to `public/config.json` and reload. |
| *The TMDB key is not valid* | Check that you copied the whole key, without extra spaces. |
| *Could not reach TMDB* | Check your internet connection or try again in a moment. |
| Page does not load | Make sure `npm start` is running and you opened [http://localhost:3000](http://localhost:3000). |

## Project Structure

```text
public/
  index.html
  styles.css
  app.js
  config.json
  media/
    lbxd_dots.png
    favicon.png
    logo.png

server.js
```

## Credits

### Developed by

**David Ferreiro**

- GitHub: [@DavidFerreiro-dev](https://github.com/DavidFerreiro-dev)
- Letterboxd: [Deybidd](https://letterboxd.com/Deybidd/)

### Letterboxd

The look of the generated images is inspired by [Letterboxd](https://letterboxd.com) and its Story sharing format. Letterboxd name, colors and logo belong to Letterboxd Limited.

This is an unofficial fan project and is not affiliated with, endorsed by or sponsored by Letterboxd.

### The Movie Database (TMDB)

All movie data and posters come from [TMDB](https://www.themoviedb.org) through its public API.

> This product uses the TMDB API but is not endorsed or certified by TMDB.

### Typography

Text in the images is set in [Inter](https://rsms.me/inter/) by Rasmus Andersson, loaded from Google Fonts under the SIL Open Font License.

### Movie Posters

Posters are the property of their respective studios and distributors. They are shown only to build the image you generate and are not stored by this project.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/DavidFerreiro-dev">David Ferreiro</a>
</p>
