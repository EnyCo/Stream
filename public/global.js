document.addEventListener("DOMContentLoaded", function () {
  loadNavbar();
  loadFooter();
});

function loadNavbar() {
  const navHTML = `
        <nav>
            <a href="index.html">Home</a>
            <a href="search.html">Search Movies</a>
            <a href="about.html">About Us</a>
        </nav>
    `;
  document.body.insertAdjacentHTML("afterbegin", navHTML);
}

function loadFooter() {
  const footerHTML = `
        <footer>
            <div style="margin-bottom: 15px;">
                <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg" 
                     alt="TMDB Logo" style="width: 100px; margin-bottom: 10px;">
                <p style="margin: 0;">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
            </div>
            <div style="margin-bottom: 15px;">
                <p style="margin: 0; font-size: 0.8em; color: #888;">
                    Streaming data powered by 
                    <a href="https://www.justwatch.com" target="_blank">JustWatch</a>.
                </p>
            </div>
            <div style="border-top: 1px solid #444; margin-top: 20px; padding-top: 20px;">
                &copy; 2025 Stream Search. All rights reserved.
            </div>
        </footer>
    `;
  document.body.insertAdjacentHTML("beforeend", footerHTML);
}
