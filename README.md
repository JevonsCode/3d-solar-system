# 3D Solar System Explorer

This project is an interactive 3D representation of our solar system built with [Three.js](https://threejs.org/) and [nipplejs](https://github.com/yoannmoinet/nipplejs). Users can orbit around the planets using an on‑screen virtual joystick.

## Project Structure

```
├─ src/
│   ├─ index.html        # Entry HTML page that loads scripts and styles
│   ├─ css/
│   │   └─ style.css      # Main stylesheet
│   └─ js/
│       └─ app.js         # JavaScript that builds the 3D scene and handles interactions
├─ .github/
│   └─ workflows/
│       └─ deploy.yml     # GitHub Actions workflow to build and deploy to GitHub Pages
└─ README.md
```

## Development

This is a pure front‑end project with no build step. All of the source files live in `src/`. To run the project locally, simply open `src/index.html` in a modern web browser. An internet connection is required to load external libraries from their CDNs.

## Deployment

The project is automatically deployed to GitHub Pages via a GitHub Actions workflow. On each push to the `main` branch the workflow copies the contents of `src/` into a `dist/` directory and publishes that folder as a Pages artifact. You can access the deployed site using the repository's configured custom domain.
## Usage

Open the application locally by launching `src/index.html` in your browser. Use the on‑screen joystick (bottom‑left) to rotate around the solar system. Each planet orbits the sun at different speeds.

When you push changes to `main`, GitHub Actions will rebuild and deploy the site to GitHub Pages automatically.

## License

This project is licensed under the MIT License.
