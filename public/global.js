// --- 1. SHARED GENRE DATA ---
const genreMap = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adv",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};

// --- 2. SETUP (Run on every page) ---
document.addEventListener("DOMContentLoaded", function () {
  loadNavbar();
  injectModalHTML(); // Creates the popup automatically
});

function loadNavbar() {
  const navHTML = `
        <nav>
            <a href="index.html">Home</a>
            <a href="search.html">Search Movies</a>
            <a href="new.html">New Releases</a>
            <a href="about.html">About Us</a>
        </nav>
    `;
  document.body.insertAdjacentHTML("afterbegin", navHTML);
}

// --- 3. DYNAMIC MODAL INJECTION ---
function injectModalHTML() {
  // Only inject if it doesn't exist yet
  if (!document.getElementById("detailModal")) {
    const modalHTML = `
            <div id="detailModal" class="modal">
                <div class="modal-content">
                    <span class="close-btn" onclick="closeModal()">&times;</span>
                    <div id="modalBody">Loading...</div>
                </div>
            </div>
        `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Close modal when clicking outside
    window.onclick = function (event) {
      const modal = document.getElementById("detailModal");
      if (event.target == modal) closeModal();
    };
  }
}

function closeModal() {
  document.getElementById("detailModal").style.display = "none";
} // --- UPDATED: DISPLAY RESULTS (Poster Only) ---
function displaySharedResults(items, containerId = "results") {
  const resultsDiv = document.getElementById(containerId);

  items.forEach((item) => {
    if (item.poster_path) {
      const itemEl = document.createElement("div");
      itemEl.className = "movie-card";

      const type = item.media_type || "movie";
      itemEl.onclick = () => openDetails(item.id, type);

      const imgUrl = `https://image.tmdb.org/t/p/w200${item.poster_path}`;
      const title = item.title || item.name;

      // ONLY display the image
      // "title" attribute allows hover text so users can see the name
      itemEl.innerHTML = `
                <img src="${imgUrl}" alt="${title}" title="${title}">
            `;
      resultsDiv.appendChild(itemEl);
    }
  });
}

// --- UPDATED: OPEN DETAILS (Year, Runtime, Rating in one row) ---
async function openDetails(id, type) {
  const modal = document.getElementById("detailModal");
  const modalBody = document.getElementById("modalBody");

  modal.style.display = "block";
  modalBody.innerHTML =
    '<div style="text-align:center; padding: 50px;">Loading details...</div>';

  try {
    const response = await fetch(`http://localhost:3000/details/${type}/${id}`);
    const data = await response.json();
    const credits = data.credits || {};

    // 1. Runtime Logic
    let runtimeMins = 0;
    if (type === "movie") {
      runtimeMins = data.runtime;
    } else if (data.episode_run_time && data.episode_run_time.length > 0) {
      runtimeMins = data.episode_run_time[0];
    }
    let runtimeStr = "N/A";
    if (runtimeMins) {
      const h = Math.floor(runtimeMins / 60);
      const m = runtimeMins % 60;
      runtimeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
    }

    // 2. Maturity Rating Logic
    let cert = "NR"; // Default to NR (Not Rated)
    if (type === "movie" && data.release_dates) {
      const us = data.release_dates.results.find((r) => r.iso_3166_1 === "US");
      if (us && us.release_dates.length > 0) {
        const found = us.release_dates.find((r) => r.certification);
        if (found) cert = found.certification;
      }
    } else if (type === "tv" && data.content_ratings) {
      const us = data.content_ratings.results.find(
        (r) => r.iso_3166_1 === "US"
      );
      if (us) cert = us.rating;
    }

    // 3. Year Logic
    const dateStr = data.release_date || data.first_air_date;
    const year = dateStr ? dateStr.split("-")[0] : "N/A";

    // 4. Cast & Crew
    const cast = credits.cast
      ? credits.cast
          .slice(0, 3)
          .map((c) => c.name)
          .join(", ")
      : "N/A";
    let director = "N/A";
    if (type === "movie" && credits.crew) {
      const dirList = credits.crew
        .filter((c) => c.job === "Director")
        .map((c) => c.name);
      if (dirList.length > 0) director = dirList.join(", ");
    } else if (type === "tv" && data.created_by) {
      director = data.created_by.map((c) => c.name).join(", ");
    }
    let producers = "N/A";
    if (credits.crew) {
      const prodList = credits.crew
        .filter((c) => c.job === "Producer" || c.job === "Executive Producer")
        .slice(0, 3)
        .map((c) => c.name);
      if (prodList.length > 0) producers = prodList.join(", ");
    }

    const title = data.title || data.name;
    const imgUrl = data.poster_path
      ? `https://image.tmdb.org/t/p/w300${data.poster_path}`
      : "https://via.placeholder.com/300x450";

    // RENDER
    modalBody.innerHTML = `
            <div class="modal-header">
                <img src="${imgUrl}" alt="${title}" class="modal-poster">
                <div class="modal-info">
                    <h2 style="margin-top:0; margin-bottom: 5px;">${title}</h2>
                    
                    <div style="color: #555; font-weight: bold; margin-bottom: 15px;">
                        ${year} &nbsp;•&nbsp; ${runtimeStr} &nbsp;•&nbsp; <span style="border: 1px solid #ccc; padding: 0 4px; border-radius: 4px; font-size: 0.9em;">${cert}</span>
                    </div>

                    ${data.tagline ? `<p><i>"${data.tagline}"</i></p>` : ""}
                    
                    <div class="section-title">Overview</div>
                    <p>${data.overview || "No description available."}</p>

                    <div class="section-title">Key Details</div>
                    <p><strong>Rating:</strong> ⭐ ${
                      data.vote_average
                        ? data.vote_average.toFixed(1) + "/10"
                        : "N/A"
                    }</p>
                    <p><strong>Genres:</strong> ${
                      data.genres
                        ? data.genres
                            .map((g) => `<span class="tag">${g.name}</span>`)
                            .join("")
                        : "N/A"
                    }</p>
                    
                    <div class="section-title">Cast & Crew</div>
                    <p><strong>Director:</strong> ${director}</p>
                    <p><strong>Top Cast:</strong> ${cast}</p>
                    <p><strong>Producers:</strong> ${producers}</p>
                </div>
            </div>
        `;
  } catch (error) {
    console.error(error);
    modalBody.innerHTML =
      '<p style="color:red; text-align:center;">Error loading details.</p>';
  }
}

async function openDetails(id, type) {
  const modal = document.getElementById("detailModal");
  const modalBody = document.getElementById("modalBody");

  modal.style.display = "block";
  modalBody.innerHTML =
    '<div style="text-align:center; padding: 50px;">Loading details...</div>';

  try {
    const response = await fetch(`http://localhost:3000/details/${type}/${id}`);
    const data = await response.json();
    const credits = data.credits || {};

    // --- 1. ASSET FETCHING ---
    // We still fetch the logo/trailer, but we won't use the backdrop as a background anymore.
    const logo =
      data.images && data.images.logos.find((img) => img.iso_639_1 === "en");
    const logoUrl = logo
      ? `https://image.tmdb.org/t/p/w500${logo.file_path}`
      : null;

    const trailer =
      data.videos &&
      data.videos.results.find(
        (vid) => vid.type === "Trailer" && vid.site === "YouTube"
      );
    const trailerLink = trailer
      ? `https://www.youtube.com/watch?v=${trailer.key}`
      : null;

    // --- 2. METADATA LOGIC ---
    let durationText = "N/A";
    if (type === "tv") {
      const seasons = data.number_of_seasons || 0;
      durationText = `${seasons} Season${seasons !== 1 ? "s" : ""}`;
    } else {
      const runtimeMins = data.runtime || 0;
      if (runtimeMins > 0) {
        const h = Math.floor(runtimeMins / 60);
        const m = runtimeMins % 60;
        durationText = h > 0 ? `${h}h ${m}m` : `${m}m`;
      }
    }

    let cert = "NR";
    if (type === "movie" && data.release_dates) {
      const us = data.release_dates.results.find((r) => r.iso_3166_1 === "US");
      if (us && us.release_dates.length > 0) {
        const found = us.release_dates.find((r) => r.certification);
        if (found) cert = found.certification;
      }
    } else if (type === "tv" && data.content_ratings) {
      const us = data.content_ratings.results.find(
        (r) => r.iso_3166_1 === "US"
      );
      if (us) cert = us.rating;
    }

    const dateStr = data.release_date || data.first_air_date;
    const year = dateStr ? dateStr.split("-")[0] : "N/A";

    const cast = credits.cast
      ? credits.cast
          .slice(0, 3)
          .map((c) => c.name)
          .join(", ")
      : "N/A";
    let director = "N/A";
    if (type === "movie" && credits.crew) {
      const dirList = credits.crew
        .filter((c) => c.job === "Director")
        .map((c) => c.name);
      if (dirList.length > 0) director = dirList.join(", ");
    } else if (type === "tv" && data.created_by) {
      director = data.created_by.map((c) => c.name).join(", ");
    }
    let producers = "N/A";
    if (credits.crew) {
      const prodList = credits.crew
        .filter((c) => c.job === "Producer" || c.job === "Executive Producer")
        .slice(0, 3)
        .map((c) => c.name);
      if (prodList.length > 0) producers = prodList.join(", ");
    }

    const title = data.title || data.name;
    const imgUrl = data.poster_path
      ? `https://image.tmdb.org/t/p/w300${data.poster_path}`
      : "https://via.placeholder.com/300x450";

    // --- 3. RENDER (Standard "Original" Layout) ---

    // Dark Mode Styling Variables
    const bgStyle = "background-color: #1f1f1f; color: #e5e5e5;";
    const dividerStyle = "border-bottom: 1px solid rgba(255,255,255,0.2);";
    const tagStyle =
      "background: rgba(255,255,255,0.1); color: #ddd; border: 1px solid rgba(255,255,255,0.2);";

    modalBody.innerHTML = `
            <div class="modal-header" style="${bgStyle} border-radius: 8px; padding: 30px; display: flex; gap: 30px;">
                
                <div style="width: 200px; flex-shrink: 0; display: flex; flex-direction: column; gap: 10px;">
                    <img src="${imgUrl}" alt="${title}" class="modal-poster" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                    
                    <div style="text-align: center;">
                        <div style="font-size: 0.9em; line-height: 1.4; margin-bottom: 8px;">
                            ${
                              data.genres
                                ? data.genres
                                    .map(
                                      (g) =>
                                        `<span class="tag" 
                                       onclick="window.location.href='search.html?tab=genre&type=multi&genre=${g.id}'" 
                                       style="display:inline-block; margin:2px; cursor:pointer; padding: 2px 6px; border-radius: 4px; ${tagStyle}" 
                                       title="Browse all ${g.name}">
                                       ${g.name}
                                </span>`
                                    )
                                    .join("")
                                : "N/A"
                            }
                        </div>

                        <div style="font-weight: bold;">
                            ⭐ ${
                              data.vote_average
                                ? data.vote_average.toFixed(1) + "/10"
                                : "N/A"
                            }
                        </div>
                    </div>
                </div>

                <div class="modal-info" style="flex-grow: 1;">
                    
                    ${
                      logoUrl
                        ? `<img src="${logoUrl}" alt="${title}" style="max-height: 80px; max-width: 100%; margin-bottom: 15px; display: block;">`
                        : `<h2 style="margin-top:0; margin-bottom: 5px;">${title}</h2>`
                    }
                    
                    <div style="font-weight: bold; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; color: #aaa;">
                        <span style="color: white;">${year}</span> • <span>${durationText}</span> • <span style="border: 1px solid #777; color: white; padding: 0 4px; border-radius: 4px; font-size: 0.9em;">${cert}</span>
                    </div>

                    ${
                      trailerLink
                        ? `<a href="${trailerLink}" target="_blank" style="display: inline-block; background-color: white; color: black; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-bottom: 15px; border: 1px solid #ccc; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">▶ Watch Trailer</a>`
                        : ""
                    }

                    <div class="section-title" style="${dividerStyle} margin-bottom:10px; font-weight: bold;">Overview</div>
                    <p style="line-height: 1.5; color: #ccc;">${
                      data.overview || "No description available."
                    }</p>
                    
                    <div class="section-title" style="${dividerStyle} margin-bottom:10px; margin-top: 20px; font-weight: bold;">Cast & Crew</div>
                    <p style="color: #ccc;"><strong>Director:</strong> <span style="color: #e5e5e5;">${director}</span></p>
                    <p style="color: #ccc;"><strong>Top Cast:</strong> <span style="color: #e5e5e5;">${cast}</span></p>
                    <p style="color: #ccc;"><strong>Producers:</strong> <span style="color: #e5e5e5;">${producers}</span></p>
                </div>
            </div>
        `;
  } catch (error) {
    console.error(error);
    modalBody.innerHTML =
      '<p style="color:red; text-align:center;">Error loading details.</p>';
  }
}
