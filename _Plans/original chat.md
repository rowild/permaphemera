I would like to brainstorm with you a web project. I will give you a description as good as I can, than I want you really shoot question at me that cover topics I don't think about or I forgot or whatever. Ask as long as there is need to eventually create a solid plan with implementation steps, programming rules etcetc. Do you understand what I mean? Or did I formulate my question what I need you for too loosley? PLease ask, if the latter is the case, but be aware that this would not yet be the brainstorming project. 

Crystal Clear.
I know exactly what you need. You aren't looking for a cheerleader to say "great idea!" You need a critical sounding board to poke holes in your logic, expose blind spots, and extract the missing details before a single line of code is written.

Your formulation is perfect. Here is how we will handle this workflow:

Phase 1: The Pitch – You lay out the project description with whatever details you have right now.

Phase 2: The Interrogation – I will cross-examine the idea. Instead of hitting you with a massive, overwhelming wall of 50 questions, I’ll fire them off in targeted, logical rounds. We will grill topics like user friction, edge cases, state management, data persistence, and architectural scale.

Phase 3: The Blueprint – Once we’ve systematically eliminated the unknowns, we will lock down a concrete plan: tech stack confirmation, strict programming rules, data models, and step-by-step implementation milestones.

The alignment is 100% there. Whenever you are ready, drop the project description and let's get to work.

Exxcellent. Excellent. Here is my pitch. first the technical basis I know this is where to start with but my technical basis is usually always directors for the backend stuff. cloudflare for the data files like images audio for stuff like that. and next four wait for the front end. The front end will use gsap 3js and other fancy JavaScript libraries to make the whole thing and experience. second the idea the idea is to photograph exhibitions with a 360° camera like the DJI osmo 360. I want to take various images from different spots of each room of an exhibition. And 10% them in the internet. as walkable well, you know from spot to spot. 3D experiences Why exhibitions because exhibitions get lost usually there is one exhibition of an artist. It may be last 2 weeks and then it's over. So what then nothing remains this whole idea is dedicated to the facts that exhibitions should be documented and saved for historical reasons Third location at the moment. I'm in Austria more specifically in Corinthia. And even more specifically in hospital Underground. Where there is a little Park close? Which has exactly one room. With various exhibitions over the summer I think six in total. This is what I want to start. And I can start here because I know the person. Who handles the exhibitions? for Eventually, the website should list all galleries that take part in this project. Then when a gallery is selected, there should be a time frame or maybe I don't know. You know a list by artists but by date or something like that so that the user can search and look for the proper exhibition. And other stuff like you know, when there is one artist who has more than one exhibition. Then of course more than one exhibition should be shown. 5 this is an addendum to number one, which was the technical basis. We do have a photo viewer of photo Panorama view of photos 360 view. I don't know exactly the kids up name of this Reaper, but it seems to be very useful here. I needed to do some research. So far from my side, what do you think? 

The core concept is solid. The problem is real—temporary art exhibitions take weeks of effort to set up, vanish into thin air, and are usually only survived by a few flat, uninspired 2D photos. Archiving them as immersive experiences is a great use case.

Starting with the single-room pilot in Carinthia (with 6 summer exhibitions) is the perfect way to build a proof-of-concept (POC) without getting buried in complexity.

The tech stack (Directus + Cloudflare + Nuxt 4 + Three.js/GSAP) is highly capable, but combining 360° media with smooth web performance introduces immediate friction points. Before writing any code, we need to address how this actually functions under the hood.

The Reality Check
1. The "Spot-to-Spot" Metadata Nightmare
A 360° image is just a flat, equirectangular projection wrapped inside a sphere. It has no inherent spatial awareness. It doesn't know that Spot B is five meters to the left of Spot A.
To make it "walkable," you have to define hotspots (click zones) on the sphere that trigger a transition to the next image. If you hardcode these coordinates in the frontend, the project will die the moment you try to scale past the first room. The spatial relationships, angles, and destination IDs must be dynamically managed in the backend.

2. The 8K Performance Wall
To make a 360° view look crisp when a user zooms in on a painting, you need high-resolution images (typically 8K or higher).

Drop three or four unoptimized 8K equirectangular images into a mobile browser via a Three.js canvas, and the site will lag, crash, or burn through the user's data plan.

You will need an aggressive asset pipeline on Cloudflare (using WebP/AVIF, or ideally, image tiling/cubemaps where the viewer only loads the specific portion of the sphere the user is currently looking at).

3. The Viewer Library
The repository you are trying to remember is likely Photo Sphere Viewer (built on Three.js) or Marzipano (excellent for cubemaps and high performance). Both handle hotspots well, but integrating them deeply with Nuxt 4's component lifecycle and driving the UI animations via GSAP requires careful state management.

Interrogation: Round 1 (Data & Spatial Mapping)
To turn this into a scalable platform rather than a one-off digital marketing gimmick, we need to lock down the relationship between your data and the physical space.

How do you plan to map and store the spatial relationships (the navigation hotspots) between the different 360° photo spots in Directus so that the Nuxt frontend knows exactly where to place the "walk-to" arrows on the screen?

Ideally, the system should work like matterport (or similar platforms made for real estate): upload various 360 degree images, define hot spots and voila! Marzipano is also a solution I like a lot, but I don't know if it is possible to integrate in the Directus/Nuxt4 pipeline, and even if, can a once finished project be edited.



The "simplest" usecase would be to create a Directus plugin that shows the 3D image (either in a viewer or indeed only as a 2:1 file) where I can interactively put hot spots. I would have to do that for each image separately, which would not be a problem, since we are talking about 5 to 10 images of this very room at the moment, but when the project scales, this is not very useful. The hotspots would also not really be at the same spot, which at the moment would also not be a big problem, but again, when the project scale, it will become a problem.



Marzipano probably helps a bit better with these requirements than the other tool you found, but I don't know.



Can you give me a feedback on my thoughts and also about platforms like Matterport and similar platforms? Maybe there is an opensource Matterport-like tool?

Your reasoning is mostly on point, but you are bumping up against the classic trade-off in web-based 3D: automated spatial awareness vs. complete data control. ---

1. Marzipano in Nuxt 4 + Directus: Editing & Feasibility
Marzipano is a client-side JavaScript library. It does not care where its configuration comes from. This means your plan is completely feasible.

Can a finished project be edited? Yes, instantly. If you bypass the static "Marzipano Tool" exporter and instead feed the raw Marzipano JavaScript API a dynamic JSON object fetched from Directus via Nuxt 4 (useFetch), editing is effortless. The moment you change a hotspot coordinate or swap an image in the Directus dashboard, the Nuxt frontend updates on the next page refresh.

The Directus Extension Idea: Building a custom Directus Interface Extension (which uses Vue 3 under the hood) to display a 360 viewer where you click to save hotspot coordinates is exactly the right architectural move.

The Scaling Problem: You identified the flaw yourself. If you map hotspots image-by-image, you have to open Spot A, link to Spot B, then open Spot B, and link back to Spot A. To scale, your Directus extension shouldn't just look at one image; it should look at a 2D floor plan layout. You drop the camera spots onto a 2D floor plan, draw vector lines connecting them, and let the backend calculate the relative angles and injection coordinates automatically.

2. The Truth About Matterport & Commercial Platforms
Matterport looks incredible because it doesn't just link photos; it calculates a true 3D mesh (Dollhouse view) using computer vision or LiDAR data. When you click to move, it projects the panorama onto that rough 3D geometry to simulate continuous physical movement.

For archiving art exhibitions, Matterport has distinct flaws:

The Compression Trap: Matterport heavily compresses images to make its global streaming network function. For fine art exhibitions where users want to zoom in and read small text on a placard or see the brushstrokes of a painting, Matterport's image quality is insufficient.

The Walled Garden: You are completely locked into their subscription ecosystem. You cannot download the tour code to host it yourself on Cloudflare, and you are subject to their pricing tiers per "active space."

SaaS Competitors (CloudPano, Kuula, Panoee): These are lighter, allow higher-resolution images, and handle hotspots well—but they are still closed platforms. You cannot deeply integrate them with custom GSAP transitions or a bespoke Nuxt frontend layout.

3. Open-Source Matterport-Like Alternatives
There is no magical, open-source tool that will take 5 flat 360 photos and automatically generate a perfect Matterport-style 3D dollhouse transition for free. 3D spatial reconstruction is highly proprietary.

However, you have strong open-source options to build this yourself:

Pannellum
An alternative to Marzipano. It is incredibly lightweight, built on WebGL, and has a much cleaner, better-documented API for injecting dynamic hotspots via JSON than Marzipano. If Marzipano feels too rigid or outdated in its architecture, Pannellum is the standard fallback for custom developer pipelines.

SPHR (Spatial Hackable Reality)
An open-source digital twin and virtual tour builder built specifically on Three.js. It attempts to bridge the gap between flat 360 photos and Matterport. It uses a dual environment cube system (EnvCube.js) to lerp (linearly interpolate) the camera position between two 360 spots, rendering the transition onto a WebGL cube map to simulate actual physical movement through space.

Interrogation: Round 2 (The Pilot UX)
Since we are launching a pilot with a single-room gallery hosting 6 summer exhibitions in Carinthia, we need to define the user interface before locking down the database schema.

Are these 360 walk-throughs meant to be clean, self-contained interactive experiences (like a full-screen application), or will they be deeply integrated with standard e-commerce/informational web pages where clicking an artwork inside the 3D space opens up a traditional Nuxt side-panel with text, pricing, and high-res flat photos?

Before I answer your latest question, here some facts that are important:

- This is NOT in any sense an e-commerce project; It is ONLY a archive with free access at the moment (maybe later there will be a login, but never a pay wall); nothing is sold!

- The idea of zooming in in order to see an image close up and in high resolution is NOT the way to go. At the moment this is actually not a topic at all, because at the moment we concentrate on capturing the mood of the exhibition, not the individual works. If the individual works should ever be something that a user can look at in close-up, then these images would be provided separately and be opened via a click area in the 360 image. But that is "music for the future" and should not concern us right now.

- I know Panellum, but from what I know this library is no longer continued, isn't it?



To answer your question:

- Each exhibition will have 10 to 20 360 panorama images.

- These images are taken from a "bird view", a "human view" and sometimes also from a "dog's view" (if items are hanging low).

- Each view will be taken from the same locations in the room, so one "hot spot" will have 3 options to "look into the room": high - middle - low. (I do not know yet how to integrate that; maybe via a drop down...)

- The "hot spots" will be there, where the tripod is visible; that should make the hot spots be placed rather exact over the various 360 images.



So the experience for the user should be (one option, but there are more possibilities):

- show me a gallery

- show me the exhibitions in a certain time frame (or show me one particular artist - more artists can share 1 exhibition)

- Then a home page of that particular exhibition is shown with info about the artist(s) and content of the exhibition and a "Start experience" button that opens the 360 degree "tool" with the hot spots (and maybe info points). This div with a containing canvas should be possible to make full-screen.



And that's it for one exhibition. No other stuff at the moment, no clicking on singular items, no e-commerce.

Fact Alignment & Tech Clearance
The Pannellum Status Check
You are partially right about Pannellum. Architecturally, it is a legacy codebase (it literally traces back to three.js r40 from over a decade ago). However, it is not dead. The maintainer actually pushed version 2.5.7 recently (February 2026) to address critical security vulnerabilities and iOS permission updates.

That said, because it relies on a custom, monolithic WebGL/Vanilla JS architecture, trying to force it to play nice with Nuxt 4’s reactive component lifecycle or custom GSAP logic is a headache. Stick with Marzipano or raw Three.js spheres for this level of customization.

Mood vs. Detail
Understood. De-prioritizing the extreme zoom/high-res artwork details changes everything for the asset pipeline. We don't need multi-resolution tiling yet. Standard 4K or optimized 8K compressed equirectangular files will easily suffice to capture the room's atmosphere while keeping loading times snappy.

The Core Structural Challenge: The "Vertical Stack"
Your choice to shoot from three distinct heights (Bird, Human, Dog) from the exact same tripod footprint is brilliant for UX, but it requires a specialized data structure in Directus.

If you map images directly to other images, your database will become an interconnected web of chaos. You need an abstraction layer.

Instead of thinking in terms of images, the frontend needs to think in terms of Waypoints (Physical Locations).

The Recommended Data Schema
Waypoints Collection: Stores the physical coordinate or reference ID of where the tripod stood in the room.

Panoramas Collection (Many-to-One with Waypoints): Stores the actual image file, but flags it with an altitude field: bird, human, or dog.

Hotspots Collection: Connects Source Waypoint ID to Destination Waypoint ID and stores the raw directional angle (yaw/pitch) where the arrow should appear.

[ Waypoint A ] ──(Hotspot Angle)──> [ Waypoint B ]
     │                                   │
     ├──> Bird Image                     ├──> Bird Image
     ├──> Human Image                    ├──> Human Image
     └──> Dog Image                      └──> Dog Image
By separating the physical layout from the images, your Nuxt frontend can track a global state variable: currentAltitude = 'human'.

When a user clicks the dropdown to switch to "Dog's View," the player stays at the same Waypoint but swaps out the underlying texture file. If they walk forward while in "Dog's View," the frontend transitions them to the next Waypoint’s dog image automatically. This keeps the UX incredibly intuitive.

Interrogation: Round 3 (The Navigation Pipeline)
Since the user flow is straightforward (Gallery Directory → Exhibition Splash Page → Fullscreen Canvas Experience), let's dissect the exact mechanics of how a user navigates through this virtual space.

How should the visual transition feel when a user moves from Spot A to Spot B or switches altitudes? Are we talking a sudden "cut-frame" swap, a camera fade-to-black, or a smooth GSAP-driven zoom/fade overlay that preserves the artistic mood of the gallery?

It has to be definitely Zoom/fade overlay solution!



As for the level of height and the tripod locations:

- The tripod locations will be rather exact, but not to the point, so don't assume this is something you can rely on. it is fine enough for humans, but it must not become a programmatical or mathematical obsticle. I will assign the hot spots manually, and that's it.

- The level-locked view: No, let's not do that. Too complicated. The hot spot itself must suffice, otherwise these are just images that fade/zoom in/out, the next" image will be given dynamically to the fade logic. That is easy and has been done millions of times. Let's not re-invent something. We can maybe use distinct icons to indicate a level, but it must not become something that complicates things.

Heard loud and clear. No over-engineering, no algorithmic spatial mapping. Keep it dead simple, flat, and driven by manual curation. You are completely right: for a pilot of this size, manual hotspot assignment is faster to build and completely bulletproof against real-world tripod deviations.

Since we are stripping out the abstraction layer, the data structure collapses into a beautifully simple relational pair.

The Recalibrated Schema
Panoramas Collection: Stores the file from Cloudflare, a title, a height flag (bird, human, dog) just for icon rendering, and the parent Exhibition ID.

Hotspots Collection: * source_panorama_id (The image the user is currently looking at)

target_panorama_id (The image the user will warp to)

coordinates (X/Y or Yaw/Pitch coordinates of where the click target sits on the source image)

icon_type (Standard arrow, high-view, low-view, or info-point)

Technical Execution: The GSAP Zoom/Fade
To achieve that seamless cinematic zoom/fade transition without reinventing the wheel:

The Zoom: When a hotspot is clicked, GSAP tweens the camera's Field of View (FOV) inward (e.g., from 75 down to 30) over 0.5 seconds, creating the optical illusion of physically lunging forward into the space.

The Fade: Simultaneously, a fullscreen Nuxt overlay component (opacity: 0) fades to 1.

The Swap: While the screen is briefly dark/covered, the frontend destroys the old texture, instantiates the target_panorama_id texture, resets the FOV, and GSAP fades the overlay back to 0.

This is lightweight, handles asset garbage collection properly so mobile browsers don't crash, and delivers exactly that moody, artistic experience you're aiming for.

Interrogation: Round 4 (The Arrival Orientation)
Since we are entirely manual now, we have to tackle the "Where am I looking?" problem.

When a user clicks a hotspot to move from the center of the room to the back corner, they expect to still be looking toward the back corner when they arrive. If the target panorama initializes facing a random wall because of how the camera happened to be turned on its tripod, the user will instantly lose all sense of direction.

When defining a hotspot in Directus, do you want to manually store an "Arrival Angle" (Target Yaw) so the frontend knows exactly which direction the camera should be facing the moment the fade overlay clears?

The "Arrival Angle" is an awesome idea. If that is possible, please integrate it!



As for the cross animation: i do not like, what you describe! First of all, the loading of the images should be lazy and in the background. So the syxtem should use the time, when a user "only" looks at the current panorama and does not initiate any image change, to load all the panorama images this particular exhibition offers. That means:

- If the image has NOT been loaded yet, display a loading item, but do not yet fade/scale out! vOnce the image is loaded, fade out the old one WHILE fading in the new one. The "black overlay" situation should not be needed... and it is not a good idea... it is like switching of the light, when I move some steps around in the exhibition room. The room should always be visible...

- If the image HAS been loaded already, the transition can start immediately.



Key is that the app starts downloading all the images for an exhibitions in the background lazily, so the image loading process can be made as invisible as possible.



One more thing I forgot to mention: The panorama images will be tinified via the tinify API. So an image size can easily have 12000:6000px

The Correction: Cross-Fading & Preloading
Your rejection of the fade-to-black approach is spot on. A true cross-fade where the current room remains visible while the next one materializes around the user is infinitely more elegant and preserves the spatial continuity.

From a technical perspective in Three.js, this means your scene will actually contain two concentric spheres (or cube maps) at the same position.

Sphere A (Current): Material opacity starts at 1 and tweens down to 0.

Sphere B (Target): Sits slightly inside or outside Sphere A. Its material opacity starts at 0 and tweens up to 1 while GSAP handles the FOV zoom.

Once the transition ends, Sphere A's texture is unlinked, Sphere B becomes the primary, and the system readies itself for the next move.

The Reality Check: The 12K VRAM Bomb
We need to talk about the 12,000 × 6,000px resolution. While the Tinify API is fantastic for shrinking file sizes over the network (e.g., compressing a 20MB file down to a 3MB WebP for fast downloading), the GPU does not care about file compression.

When a browser decodes an image to render it inside a WebGL context, it uncompresses it into a raw bitmap in Video RAM (VRAM). The math for a 12K × 6K image looks like this:

Total Pixels=12,000×6,000=72,000,000 pixels (72 Megapixels)
VRAM Usage=72,000,000×4 bytes (RGBA channels)≈288 MB per image
If your app lazily downloads and instantiates all 20 images of an exhibition into WebGL textures in the background, you will be holding roughly 5.7 GB of uncompressed textures in VRAM simultaneously.

If a user opens this on an iPhone or a mid-range Android device, the mobile browser will instantly crash due to memory exhaustion, throwing a WebGL: CONTEXT_LOST error.

The Solution: Network Cache vs. GPU Cache
To keep your exact vision (cross-fading + lazy background loading) without crashing devices, we must split the pipeline:

Lazy Download (Network Cache): Nuxt fetches the 20 compressed image files in the background via standard JS Image() objects or an XHR blobloader. This stores them safely in the browser's disk/RAM cache without parsing them into the GPU. This uses almost no system overhead.

Just-In-Time Texture Creation (GPU Cache): The moment a user hovers over or initiates a move to a hotspot, the frontend pulls the already-downloaded image from the browser cache, instantiates it as a WebGL texture (taking the 288MB hit for just that target image), performs the cross-fade, and immediately destroys the previous image's texture to free up the 288MB from the GPU.

The Master Blueprint So Far
Our structural rules are locking into place nicely:

Data Layout: Exhibition → Panoramas (with Height Flag) → Hotspots (with Source ID, Target ID, Canvas Coordinates, and Target Arrival Yaw Angle).

Asset Pipeline: Background network-only preloading. Max 2 active WebGL textures allowed in VRAM at any exact microsecond (The current sphere + the target cross-fade sphere).

Interrogation: Round 4 (The Calibration Workflow)
Since you are assigning these hotspots manually, we need to think about your administrative sanity inside Directus.

To link Spot A to Spot B, you need to know the visual coordinates on Spot A where the arrow belongs, and you also need to know the exact "Arrival Angle" (Yaw) for Spot B so the user faces the right direction when they land. Doing this by guessing numbers and typing them into spreadsheet rows will make you lose your mind by the third exhibition.

For the custom Directus Vue 3 extension we talked about building, do you want a visual tool where you click on the 360 view to drop a hotspot arrow, and then a "Split Screen" or "Preview Window" pops up showing the destination image so you can visually rotate it to set the exact arrival angle?

That sounds great - if that is possible, than please yes!



As for the images sizes and network cache: My idea was of course to use the local browser cache the the images loaded. So if there was a misunderstanding,please let me clarify that I want lazy-loading with browser cache

There was no misunderstanding—we are perfectly aligned on the network cache now. Storing the compressed assets in the browser's native disk cache while strictly limiting what is parsed into the GPU's active VRAM is the golden path for this project.

And as for the custom Directus extension: building that split-screen calibration tool is entirely feasible. Directus extensions are just Vue 3 components, meaning you can pull your Three.js/Marzipano logic straight into the admin dashboard. You click to drop a hotspot on the left panel (Source Image), and a mini-canvas on the right panel (Target Image) lets you scroll to set the default arrival view. It saves you hundreds of hours of manual guesswork.

We are incredibly close to a complete, bulletproof system architecture. There is only one major architectural blind spot left to clear before we compile the complete implementation blueprint.

Interrogation: Round 5 (State Management & Deep Linking)
Because this project is an exhibition archive, people (artists, curators, historical researchers, or visitors sharing on social media) will want to point others to specific things within the digital space.

If someone finds a perfect angle on an installation from the "Dog's View" at Spot #4, they will want to copy the URL and message it to a colleague.

The Question
Do we need the Nuxt 4 frontend to continuously synchronize the user’s exact virtual position, altitude view, and camera coordinates directly to the browser's URL address bar?

For example, should the URL update dynamically as they walk around to look like this:
https://archive.gallery/exhibitions/summer-2026?spot=4&view=dog&yaw=185&pitch=-10

Implementing this means that if a user refreshes the page or clicks a shared link, the Nuxt router must parse those query parameters and immediately initialize the Three.js canvas at that exact spot, altitude, and orientation.

Do you want full deep-linking integrated into the system routing, or should every entry into an exhibition simply start at the default "Front Door" panorama?

I think that is overkill. updating the view/location permanently via URL params is really not necessary. And an exhibition should always start at the first image ("Front door panorama", as you call it), that I define via the Directus backend. However, if there is a chance to create such a link on demand, e.g. "Share this view angle", then it would be nice if such a link could be created and interpreted. Would that be possible?

Yes, absolutely. In fact, this on-demand approach is significantly cleaner than constantly tracking state in the URL. It saves browser performance, avoids cluttering the user's back-button history, and gives you the exact functionality you want.

How the On-Demand Share Link Works
Instead of the Nuxt router constantly watching the camera, the system only looks at the state when the user explicitly clicks a "Share View" button.

The Generation: When clicked, a JavaScript function grabs the active variables from your Three.js/Marzipano instance: the current panorama_id, the camera's yaw, and the camera's pitch. It strings them into a unique URL and copies it to the user's clipboard:

https://galleryarchive.at/exhibition/slug?spot=12&yaw=3.14&pitch=-0.2

The Initialization: When someone opens that specific link, the Nuxt 4 page component checks the URL query parameters during the onMounted lifecycle hook:

Scenario A (Normal Entry): No query parameters found → Nuxt fetches the "Front door panorama" ID designated by Directus and sets the camera to its default angle.

Scenario B (Shared Entry): Query parameters found → Nuxt bypasses the default startup, requests the specific spot panorama from the browser/network cache, and initializes the WebGL camera directly at the shared yaw and pitch coordinates.

This gives you the best of both worlds: a rigid, curated entryway by default, but total flexibility for user-driven sharing.

Phase 3: The Project Blueprint
We have grilled this concept thoroughly, stripped out the fluff, protected the GPU from melting, and mapped out an efficient administrative workflow. We have everything we need to lock down the implementation plan.

Here is the technical blueprint and development roadmap for your project.

1. The Core Tech Stack
Backend/CMS: Directus (Self-hosted or Cloud, leveraging Vue 3 for admin extensions).

Storage & Delivery: Cloudflare R2 (for 12K equirectangular images) + Cloudflare Images/Transformations (for serving optimized, tinified WebP/AVIF variants).

Frontend Framework: Nuxt 4 (utilizing the Composition API and TypeScript).

3D Render Engine: Three.js (Custom double-concentric sphere layout for WebGL cross-fading).

Animation Engine: GSAP 3 (for field-of-view lens zooming and UI transitions).

2. Strict Database Schema (Directus)
Collection: exhibitions
id (UUID)

title (String)

description (WYSIWYG/Markdown)

start_date (Date)

end_date (Date)

front_door_panorama_id (Many-to-One pointing to panoramas.id)

Collection: panoramas
id (UUID)

exhibition_id (Many-to-One pointing to exhibitions.id)

image_file (Directus File / Cloudflare R2 link)

altitude (Dropdown: bird, human, dog)

Collection: hotspots
id (UUID)

source_panorama_id (Many-to-One pointing to panoramas.id)

target_panorama_id (Many-to-One pointing to panoramas.id)

yaw (Float - position on the source sphere)

pitch (Float - position on the source sphere)

target_arrival_yaw (Float - the direction the user faces upon arrival)

icon_type (Dropdown: arrow_up, arrow_down, info)

3. Core Programming Rules & Performance Constraints
Memory Management (VRAM Leak Prevention): No more than two WebGL textures may be loaded into GPU memory at any given millisecond. When a cross-fade animation completes, the old texture must have .dispose() called on its material and geometry immediately, and its reference set to null for garbage collection.

Network Caching: Utilize standard browser cache via asynchronous background fetching. When an exhibition loads, a non-blocking script must cycle through the exhibition’s panoramas image URLs, downloading them into the browser's native network cache without initializing them as WebGL objects.

State Cleanliness: The canvas viewport must stay completely decoupled from Nuxt's global reactive state (Pinia/useState) during active looking to avoid triggering unnecessary Vue rerenders at 60fps. Only structural state changes (changing rooms, firing a share link) pass through the framework.

4. Step-by-Step Implementation Steps
Milestone 1: The Raw Data Pipeline
Set up Directus and configure the exhibitions, panoramas, and hotspots collections.

Upload a sample set of 5 test panoramas representing a single simulated room.

Connect Directus to Cloudflare to ensure image assets serve rapidly over WebP/AVIF.

Milestone 2: The Three.js Cross-Fade Engine (Proof of Concept)
Build a standalone Nuxt 4 page containing a full-screen Three.js canvas.

Implement the double-sphere architecture: Sphere A (visible) and Sphere B (hidden).

Code the transition function: On command, trigger a GSAP tween that narrows the camera FOV while cross-fading the opacity of Sphere A to 0 and Sphere B to 1.

Milestone 3: Manual Hotspot Directus Extension
Build a custom Directus Interface Extension using Vue 3.

Create the split-screen view: Left side displays the source panorama to click and save yaw/pitch coordinates; right side loads the target panorama, allowing you to orbit the camera and save the target_arrival_yaw.

Milestone 4: Frontend Assembly & Deep Linking
Build the directory pages in Nuxt 4 (Exhibition listing → Exhibition Splash Page).

Hook the hotspot click events inside Three.js to trigger the transition engine using the target data fetched from Directus.

Implement the "Share View" button logic to generate and parse URL query parameters for on-demand deep linking.

Milestone 5: Optimization & Deployment
Run performance profiles on mobile safari/chrome to monitor VRAM stability.

Deploy the application to your production server environment.

We have a completely solid plan. Do you want to dive straight into writing the boilerplate code for the Nuxt 4 Three.js transition component, or should we adjust any part of this blueprint first?

Well, I think I should give you more info on the Directus instance we will be using, the mcp server there is, and I totally forgot that I really would appreciate the use of tailwindcss in its latest version. We will also need multi-language capabilities in the backend as well as the frontend (with the nuxt extensions that are available, but unfortunately very confusing, when it comes to configuring them; so for that I would like to point to a specific local project, which has a perfect implementation of the language modules). There is a Directus SDK that should probably be used instead of a custom built RestAPI or so. As for the backend: the concept you lined out is too modest. We need collections for

- locations (including geo data, city name [one city can have multiple galleries])

- galleries (the name of the building where the exhibition took place; one such gallery has multiple exhibitions)

- artists (with links to their personal websites)

- important: one exhibition can have multiple artists, and maybe even multiple locations



What must be mentioned in the plan as "To be implemented later" is:

- There must be a fuzzy search (location, artist, exhibition)

- There must be a map-based search, where users can search within a certain area to find a location and/or gallery



I think this is not overkill for the first round - what do you think?



And I also forgot to mention that I already have an extension that connects Directus to Cloudflare.

This is a massive step up. We are moving away from a simple point-to-point photo viewer and transforming this into a full-scale, structured, localized digital cultural archive.

Expanding the schema now prevents the architecture from shattering later when you scale beyond your first venue in Carinthia. It also gives us a clear pattern for your multi-language requirements.

1. Upgraded Database Schema (The Enterprise Grid)
To support multiple cities, distinct buildings, and collaborative exhibitions featuring multiple artists across multiple venues, your Directus schema needs explicit relational junction tables.

Additionally, we will utilize Directus’s native Translations Interface for localized fields (like exhibition descriptions and artist biographies).

New Collections
locations
id (UUID)

city_name (String)

geolocation (Geometry / Point - Ready for future map search)

galleries (The Physical Buildings)
id (UUID)

name (String)

location_id (Many-to-One pointing to locations.id)

artists
id (UUID)

website_url (String)

Translations Collection (artists_translations):

languages_code (Languages M2O)

first_name / last_name (String)

biography (Markdown)

exhibitions
id (UUID)

start_date / end_date (Date)

front_door_panorama_id (Many-to-One pointing to panoramas.id)

Translations Collection (exhibitions_translations):

languages_code (Languages M2O)

title (String)

description (WYSIWYG/Markdown)

Relational Junction Tables (Many-to-Many)
exhibitions_artists
id (Primary Key)

exhibition_id (Many-to-One → exhibitions)

artist_id (Many-to-One → artists)

exhibitions_locations (Tracks all venues hosting a given exhibition)
id (Primary Key)

exhibition_id (Many-to-One → exhibitions)

location_id (Many-to-One → locations)

2. Advanced Frontend Infrastructure Stack
Since you already have the Cloudflare-Directus asset bridge handled, your frontend needs to utilize modern, performant standard modules to talk to the backend and style the UI.

Tailwind CSS v4 Native Integration
Tailwind v4 drops the heavy JavaScript config files and handles optimizations natively through modern bundlers. In Nuxt 4, we inject it seamlessly via Vite without needing legacy layers:

Install the tools: tailwindcss @tailwindcss/vite

Update your configuration to compile at lightning speeds using the new layout engine:

TypeScript
// nuxt.config.ts
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
});
CSS
/* ~/assets/css/main.css */
@import "tailwindcss";
The Composable Directus SDK
Instead of writing raw REST fetches, we will leverage the type-safe, shakeable Directus SDK. This ensures your app bundle remains tiny and your requests are deeply optimized.

TypeScript
// plugins/directus.ts
import { createDirectus, rest } from '@directus/sdk';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const client = createDirectus(config.public.directusUrl).with(rest());
  
  return {
    provide: { directus: client }
  };
});
Multi-Language Pipeline (Nuxt i18n)
Since you already have a local project with a flawless i18n setup to reference, we will follow that exact paradigm. The core goal here is Lazy-Loading Translations so visitors don't download languages they aren't using.

When fetching data, the Nuxt frontend reads the browser's active locale (e.g., de-AT, en-US), handles fallback logic cleanly, and passes a deep filter rule to the Directus SDK to fetch only the matching translation row.

3. Post-Launch Roadmap (To Be Implemented Later)
We will reserve these features for the secondary phase to prevent scope creep during the pilot phase, but the database architecture above is already optimized to support them:

Fuzzy Global Search: A unified search input that scours the translated strings across exhibitions_translations, artists_translations, and locations simultaneously using Directus database string filters.

Map-Based Geo-Search: Utilizing the locations.geolocation point data to project your gallery network onto an open-source map viewport (like Leaflet or Maplibre GL), allowing users to filter exhibitions within a defined radius.

The architecture is fully scaled up and locked down. Where should we direct our focus next? We can write the concrete Directus SDK fetch query to pull a localized exhibition layout, or we can lay out the Three.js double-sphere viewport boilerplate.

Well... you are again very modest on the fields of those collections! They are really not enough!

- add to locations: state, country (like "Bundesland" => Carinthia), postal code, description, image

- add to galleries (do we have a better name for that? Maybe not all exhibition locations will be galleries; anything more general?): address, URL, image, description

- add to artist: first_name, last_name, middle_initial, artist_name, birth_year, death_year



And add even more fields if you think they fit this state! But do it now! Adding such things later is cumbersome.

You are entirely right. Skimping on the data fields early on is a classic trap that leads to painful schema migrations, broken API queries, and frontend refactoring later. Let's over-engineer the fields right now so the foundation is future-proof.

First, let's dump the word "galleries." It is too restrictive for an archive that will include public parks, historical monuments, and alternative art spaces. We will rename this collection to venues.

Here is the fully expanded, production-ready schema layout. I've added your requested fields along with essential structural fields (like slugs for clean Nuxt routing, sorting, and metadata) that you will absolutely need.

Fleshed-Out Database Schema
1. Collection: locations (The physical city/region hub)
id: UUID (Primary Key)

slug: String (Unique, index - for URLs like /locations/vienna)

city_name: String (e.g., "Spittal an der Drau")

postal_code: String (e.g., "9800")

state: String (e.g., "Carinthia" / "Kärnten")

country: String (e.g., "Austria")

geo_data: Geometry (Point - for future map integration)

image: Directus File (Cover image for the location card)

Translatable Fields (Moved to locations_translations table):

description: Text / Markdown (Context about the region's art scene)

2. Collection: venues (The building/space hosting the event)
id: UUID (Primary Key)

slug: String (Unique, index - e.g., /venues/schloss-porcia)

location_id: Many-to-One → locations.id

name: String (e.g., "Schloss Porcia")

address: String (Street name and number)

website_url: String (Link to the venue's official site)

image: Directus File (Main photo of the building/interior)

accessibility_info: Boolean or Select (e.g., wheelchair accessible)

Translatable Fields (Moved to venues_translations table):

description: Text / Markdown (History or details of the venue)

3. Collection: artists (The creators)
id: UUID (Primary Key)

slug: String (Unique, index - e.g., /artists/max-mustermann)

first_name: String

last_name: String

middle_initial: String (Optional, 1-2 characters)

artist_name: String (Pseudonym or collective name if they don't use their legal name)

birth_year: Integer (e.g., 1984)

death_year: Integer (Optional, for historical artists)

nationality: String (e.g., "Austrian")

website_url: String (Link to portfolio)

instagram_handle: String (Social media tracking)

profile_image: Directus File

Translatable Fields (Moved to artists_translations table):

biography: Text / Markdown

4. Collection: exhibitions (The core event)
id: UUID (Primary Key)

slug: String (Unique, index - e.g., /exhibitions/modern-carinthia-2026)

primary_venue_id: Many-to-One → venues.id

front_door_panorama_id: Many-to-One → panoramas.id (Default entry point)

start_date: Date

end_date: Date

is_permanent: Boolean (Default: false, for ongoing setups)

fb_event_url: String (Optional marketing link)

Translatable Fields (Moved to exhibitions_translations table):

title: String

description: Text / Markdown (The curatorial statement)

opening_hours_note: String (e.g., "Open only during gallery festival hours")

5. Collection: panoramas (The 360 images)
id: UUID (Primary Key)

exhibition_id: Many-to-One → exhibitions.id

image_file: Directus File (Points to the 12K optimized asset)

altitude: Dropdown (bird, human, dog)

sort: Integer (To manually arrange the fallback order if navigation breaks)

photographer_credit: String (Who shot the panorama)

capture_date: Date

4. Multi-Language (i18n) Structural Note
Because you specified robust multi-language functionality, any field marked above as "Translatable" will automatically spin up a child table in Directus (e.g., exhibitions_translations).

When your Nuxt 4 frontend uses the Directus SDK to fetch data, you will pass a query parameter specifying the language code (de-AT, en-US). The SDK will automatically collapse the translation layer, giving your Nuxt template a clean object like this:

JSON
{
  "title": "Summer Exhibition 2026",
  "description": "An exploration of modern spatial art...",
  "start_date": "2026-06-01"
}
This prevents your frontend from getting cluttered with nested array filtering.

With the database schema now fully fleshed out and future-proofed, do you want to look at the exact directory configuration and routing middleware required on the Nuxt 4 side to handle this multi-language architecture cleanly?

No, now it is time to write the detailed implementation plan, I think. What do you think?



If it is ok with you to write the plan then:

- Be as precise and detailed as possible

- use many code examples (at least those you already used here in this planning chat)

- add the process tracker with many detailed steps

- make sure best coding practices are supported

- mention what is missing right in the beginning of the plan (like mcp server config, Hetzner Directus config, etc...)

Technical Blueprint & Multi-Language Architecture Plan
This plan outlines the complete execution roadmap for the WebGL 360° Exhibition Archiving Platform. It covers data structures, memory management strategies, configuration setups, and a step-by-step process tracker.

1. Known Blind Spots & Excluded Configurations
The following infrastructure components are omitted from this technical blueprint and must be resolved separately using existing system templates:

Hetzner Server Provisioning: Docker Compose configurations, PostgreSQL database tuning parameters, and Reverse Proxy/SSL setups on Hetzner are not handled here.

Model Context Protocol (MCP) Server Configuration: Custom automated environment parameters, data-ingestion scrapers, or internal tool mappings running on your local MCP instance are excluded.

Nuxt i18n Workspace Synchronization: The concrete folder composition, standard middleware hooks, and locale cookie handling matching your existing multi-language reference app must be directly copied over during initial setup.

Directus-to-Cloudflare Hook Specifics: The configuration details of your existing Cloudflare asset offloading extension are assumed to run out of the box.

2. Production-Ready Database Schema (Directus v11+)
To manage multi-artist exhibitions and traveling shows without data duplication, the database leverages explicit normalization and junction collections. All metadata handles structural fallback properties and custom slugs.

Core Collections
locations
id: UUID (Primary Key)

slug: String (Unique Index, e.g., spittal-an-der-drau)

postal_code: String

state: String (e.g., Kärnten)

country: String (e.g., Austria)

geo_data: Geometry (Point)

image: File (Directus File / Cloudflare asset link)

locations_translations (Child Table)
id: Integer

locations_id: Many-to-One → locations.id

languages_code: Many-to-One → languages.code

description: Text / Markdown

venues
id: UUID (Primary Key)

slug: String (Unique Index, e.g., schloss-porcia)

location_id: Many-to-One → locations.id

name: String

address: String

website_url: String (Optional)

image: File

venues_translations (Child Table)
id: Integer

venues_id: Many-to-One → venues.id

languages_code: Many-to-One → languages.code

description: Text / Markdown

artists
id: UUID (Primary Key)

slug: String (Unique Index, e.g., max-mustermann)

first_name: String

last_name: String

middle_initial: String (Optional)

artist_name: String (Pseudonym or collective brand identity)

birth_year: Integer

death_year: Integer (Optional)

nationality: String

website_url: String

instagram_handle: String

profile_image: File

artists_translations (Child Table)
id: Integer

artists_id: Many-to-One → artists.id

languages_code: Many-to-One → languages.code

biography: Text / Markdown

exhibitions
id: UUID (Primary Key)

slug: String (Unique Index, e.g., summer-exhibition-2026)

primary_venue_id: Many-to-One → venues.id

front_door_panorama_id: Many-to-One → panoramas.id

start_date: Date

end_date: Date

is_permanent: Boolean (Default: false)

exhibitions_translations (Child Table)
id: Integer

exhibitions_id: Many-to-One → exhibitions.id

languages_code: Many-to-One → languages.code

title: String

description: Text / Markdown (Curatorial Statement)

panoramas
id: UUID (Primary Key)

exhibition_id: Many-to-One → exhibitions.id

image_file: File (Points directly to the 12K optimized target file)

altitude: Dropdown (bird, human, dog)

sort: Integer (For custom fallback sequencing)

photographer_credit: String

capture_date: Date

hotspots
id: UUID (Primary Key)

source_panorama_id: Many-to-One → panoramas.id

target_panorama_id: Many-to-One → panoramas.id

yaw: Float (Horizontal spatial target coordinate on source)

pitch: Float (Vertical spatial target coordinate on source)

target_arrival_yaw: Float (Camera rotation tracking parameter upon warp arrival)

icon_type: Dropdown (arrow_up, arrow_down, info)

Junction Collections (Many-to-Many Bridge)
exhibitions_artists
id: Integer

exhibition_id: Many-to-One → exhibitions.id

artist_id: Many-to-One → artists.id

exhibitions_locations
id: Integer

exhibition_id: Many-to-One → exhibitions.id

location_id: Many-to-One → locations.id

3. Frontend Stack Baseline Configurations (Nuxt 4)
Styling Setup: Tailwind CSS v4 Architecture
Tailwind v4 abandons tailwind.config.js in favor of a modern, native CSS-driven implementation. All design tokens are loaded directly inside the global entrypoint file.

CSS
/* assets/css/main.css */
@import "tailwindcss";

@theme {
  --color-gallery-background: #0d0d0d;
  --color-gallery-overlay: rgba(13, 13, 13, 0.85);
  --color-accent-gold: #c5a059;
  
  --font-display: "Cabinet Grotesk", "Inter", sans-serif;
  --font-body: "Inter", sans-serif;
  
  --animate-crossfade-in: fade-in 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

@layer base {
  body {
    @apply bg-gallery-background text-neutral-100 font-body antialiased selection:bg-accent-gold/30;
  }
}
Data Layer: Explicit Type-Safe Directus SDK Configuration
The integration uses the lightweight composable client library, avoiding overhead while ensuring full compile-time validation for nested translations and relations.

TypeScript
// types/schema.ts
export interface LocationTranslation {
  languages_code: string;
  description: string;
}

export interface Location {
  id: string;
  slug: string;
  city_name: string;
  postal_code: string;
  state: string;
  country: string;
  translations: LocationTranslation[];
}

export interface Panorama {
  id: string;
  exhibition_id: string;
  image_file: string;
  altitude: 'bird' | 'human' | 'dog';
}

export interface AppSchema {
  locations: Location[];
  panoramas: Panorama[];
  /* Remaining structural mappings mapped identically */
}

// plugins/directus.ts
import { createDirectus, rest, readItems } from '@directus/sdk';
import type { AppSchema } from '~/types/schema';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  
  const client = createDirectus<AppSchema>(config.public.directusUrl)
    .with(rest());

  return {
    provide: {
      directus: client
    }
  };
});
4. Technical Engineering Rules (Non-Negotiables)
Rule A: GPU VRAM Leak Prevention (Concentric Sphere Swap)
A decoded 12,000 × 6,000px equirectangular image consumes approximately 288 MB of pure, uncompressed Video RAM. Under no circumstances may more than two panorama textures stay active simultaneously in the WebGL context. The old texture must be aggressively purged on transition completion.

TypeScript
// composables/usePanoramaTexture.ts
import * as THREE from 'three';

export function usePanoramaTexture() {
  const textureLoader = new THREE.TextureLoader();

  const loadWebGLTexture = (url: string): Promise<THREE.Texture> => {
    return new Promise((resolve, reject) => {
      textureLoader.load(url, (texture) => {
        // Enforce optimization parameters for equirectangular maps
        texture.minFilter = THREE.LinearFilter;
        texture.generateMipmaps = false; 
        resolve(texture);
      }, undefined, reject);
    });
  };

  const safelyDisposeMesh = (mesh: THREE.Mesh | null) => {
    if (!mesh) return;
    
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    
    if (mesh.material) {
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (mat.map) {
        mat.map.dispose(); // Kill texture link inside VRAM
      }
      mat.dispose(); // Kill shader material allocation
    }
    
    mesh.parent?.remove(mesh);
  };

  return { loadWebGLTexture, safelyDisposeMesh };
}
Rule B: Isolated WebGL Rendering State
To maintain steady 60fps rendering, the Three.js requestAnimationFrame cycle must remain completely detached from Nuxt's reactive loop (do not wrap Three.js objects inside ref, reactive, or pinia stores). Pass navigation triggers using primitive events or explicit function arguments.

TypeScript
// components/GalleryViewer.vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { usePanoramaTexture } from '~/composables/usePanoramaTexture';

const props = defineProps<{ panoramaUrl: string; nextPanoramaUrl?: string }>();
const canvasRef = ref<HTMLCanvasElement | null>(null);

// Pure unreactive state variables - invisible to Vue tracking loop
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let currentSphere: THREE.Mesh;
let targetSphere: THREE.Mesh;

const { loadWebGLTexture, safelyDisposeMesh } = usePanoramaTexture();

const executeCrossfadeTransition = async (nextUrl: string, targetYaw: number) => {
  // 1. Fetch next texture from browser network cache instantly into WebGL
  const nextTexture = await loadWebGLTexture(nextUrl);
  
  // 2. Setup target sphere immediately inside current visible sphere
  const geometry = new THREE.SphereGeometry(490, 60, 40);
  geometry.scale(-1, 1, 1); // Invert vectors inward
  const material = new THREE.MeshBasicMaterial({ map: nextTexture, opacity: 0, transparent: true });
  targetSphere = new THREE.Mesh(geometry, material);
  scene.add(targetSphere);

  // 3. Coordinate optical illusion via GSAP
  const tl = gsap.timeline({
    onComplete: () => {
      // Clean up past mesh allocation entirely
      safelyDisposeMesh(currentSphere);
      currentSphere = targetSphere;
      camera.fov = 75; // Reset optical expansion
      camera.updateProjectionMatrix();
    }
  });

  // Lens Zoom Forward
  tl.to(camera, { fov: 40, duration: 0.6, ease: 'power2.inOut', onUpdate: () => camera.updateProjectionMatrix() }, 0);
  // Fade In Target Sphere Material
  tl.to(targetSphere.material, { opacity: 1, duration: 0.6, ease: 'linear' }, 0);
  // Orient Camera toward the assigned Target Arrival View
  tl.to(camera.rotation, { y: targetYaw, duration: 0.6, ease: 'power2.inOut' }, 0);
};

onMounted(() => {
  if (!canvasRef.value) return;
  // Initialize baseline Three.js renderer loops...
});

onBeforeUnmount(() => {
  safelyDisposeMesh(currentSphere);
  safelyDisposeMesh(targetSphere);
  renderer?.dispose();
});
</script>

<template>
  <div class="relative w-full h-screen overflow-hidden">
    <canvas ref={canvasRef} class="absolute inset-0 w-full h-full" />
  </div>
</template>
Rule C: Lazy Background Network Caching
When an exhibition page loads, execute background requests using simple HTML image elements. This forces the browser to pull assets over the wire into local disk/RAM cache without generating WebGL texture objects prematurely.

TypeScript
// utils/preloadGalleryAssets.ts
export function preloadPanoramasToCache(urls: string[]): void {
  if (typeof window === 'undefined') return;
  
  urls.forEach((url) => {
    const img = new Image();
    img.src = url; // Leverages browser cache mechanisms automatically
  });
}
5. Detailed Process Tracker
[ ] PHASE 1: REPOSITORY SETUP & CORE INTEGRATION
    ├── [ ] Scaffold clean Nuxt 4 workspace with TypeScript strict modes enabled
    ├── [ ] Install development dependencies: tailwindcss @tailwindcss/cli gsap three @types/three
    ├── [ ] Initialize assets/css/main.css containing Tailwind v4 @theme blocks
    └── [ ] Inject plugins/directus.ts using official composable client instance

[ ] PHASE 2: DATABASE ARCHITECTURE CONFIGURATION
    ├── [ ] Construct localized tables: locations, venues, artists, exhibitions, panoramas, hotspots
    ├── [ ] Spin up standard system language codes and establish structural _translations links
    ├── [ ] Configure relational M2M junction keys (exhibitions_artists, exhibitions_locations)
    └── [ ] Test data query payload outputs using Directus SDK deep filtering for locale switching

[ ] PHASE 3: COMPONENT DEVELOPMENT & TEXTURE SAFETY PIPELINE
    ├── [ ] Implement usePanoramaTexture abstraction ensuring explicit .dispose() execution
    ├── [ ] Code background asset preload asset script utilizing standard browser disk cache pools
    ├── [ ] Build full-screen WebGL component managing concentric Sphere A and Sphere B placements
    └── [ ] Wire up GSAP timelines coordinating synchronized FOV manipulation and material alpha animations

[ ] PHASE 4: THE DIRECTUS CALIBRATION EXTENSION
    ├── [ ] Initialize native Directus Interface Extension boilerplate utilizing Vue 3
    ├── [ ] Mount dual Three.js viewports inside layout container canvas panel
    ├── [ ] Code left canvas event listener saving coordinates on targeted source sphere meshes
    └── [ ] Link right preview canvas binding scroll movements directly to target_arrival_yaw field data

[ ] PHASE 5: USER FLOW FRONTEND WIRING
    ├── [ ] Synchronize existing localized layout routing mechanisms from reference template repository
    ├── [ ] Build entry directory pages displaying locations -> venues -> exhibition listings
    ├── [ ] Implement on-demand share view listener stringifying parameters (?spot=&yaw=&pitch=)
    └── [ ] Build deep link router parsing hook executing initial scene placement override on mount

[ ] PHASE 6: OPTIMIZATION AND AUDIT CHECKLIST
    ├── [ ] Verify VRAM ceilings via Google Chrome allocation profile logs (Confirm max 2 active textures)
    ├── [ ] Confirm responsive touch gestures and view transformations hold stable on mobile devices
    └── [ ] Deploy production build targeting live infrastructure environment
Excellent! Thank you! - Can you please be creative and think of a name for this project? Maybe 10 different names?

Here are 10 project names tailored specifically to your goals—focusing on preservation, the "mood" of the space, and the technical node-to-node walkthrough structure. No corporate fluff, just clean and memorable options.

1. Finissage Archive
In the art world, the Finissage is the closing party of an exhibition—the moment it vanishes. This name frames your project as the historical layer that begins exactly when the physical exhibition ends.

2. Aura360
This is a direct nod to your focus on capturing the "mood" of the room rather than high-resolution itemized scans. It references the classic artistic philosophy of preserving the unique "aura" of a physical space.

3. RaumNode
A clean, half-German, half-technical name. It perfectly describes the application's underlying architecture: a network of physical room coordinates (Raum) connected by interactive navigation points (Nodes).

4. VantageSphere
This highlights your specific three-tier shooting workflow (Bird, Human, Dog views). It tells the user that they aren't just looking at a flat photo, but controlling their vantage point inside a 3D sphere.

5. ExhibitVault
Sturdy, institutional, and archival. It positions the platform as a secure, permanent historical repository for temporary cultural events.

6. StitchGallery
A clever double meaning. It references the technical process of stitching your 12K equirectangular panorama images together, while conceptually stitching temporary local exhibitions into a single global map.

7. Ephemere
Derived from "ephemeral" (lasting for a very short time). It’s poetic, minimal, and directly addresses the core problem you are solving: saving art installations that only look beautiful for two weeks before being destroyed.

8. AmbientDoc
Professional and functional. It lets the user and participating venues know exactly what the platform does: documenting the environmental atmosphere of a space rather than acting as a commercial e-commerce storefront.

9. SpotWalk
Dead simple, lightweight, and highly scannable. It describes the exact friction-free user experience of moving from tripod spot to tripod spot inside the Nuxt frontend canvas.

10. PermaSpace
Clear and modern. It takes a temporary real-world setup and converts it into a permanent digital environment that can be accessed for decades.

Hmmm... I like the contradiction between ephemeral and perma. Any ideas with that combi?

That contradiction is the absolute sweet spot for this project. It highlights exactly what you are doing: capturing something fleeting and anchoring it forever.

Here are name ideas that weaponize that exact "ephemeral vs. permanent" tension, ranging from literal mashups to punchy oxymorons.

1. PermaPhemera
The most direct mashup. It takes the word ephemera (things that exist or are used for only a short time) and locks it behind perma. It is memorable, slightly academic, and tells the user exactly what the archive does.

2. PermaVanish
A sharp, punchy contradiction. It implies that the act of the exhibition vanishing has itself been captured and frozen in time permanently.

3. FixedFlux
A high-concept oxymoron. An exhibition is a fluid, temporary event (flux), but your WebGL 360 platform freezes it into a permanent, unchangeable digital layout (fixed).

4. EphemereLock
Action-oriented and clean. It balances the poetic, French-leaning aesthetic of Éphémère with the hard, technical finality of Lock. You are locking down the fleeting.

5. PermaTrace
Art exhibitions disappear, but they leave a trace. This name positions your project as the definitive, permanent digital footprint of a physical space that no longer exists.

6. FadeHold
Short, modern, and built entirely from contrasting verbs. The physical installation is destined to fade, but your application takes dynamic hold of it before it can.

7. EphemereCast
Think of casting a delicate, temporary object in bronze or concrete. This name frames your 360-degree photography process as a digital "casting" method that renders the fleeting permanent.

8. StaticFlux
Similar to FixedFlux, this plays on the technical implementation. The interactive canvas allows the user to experience the fluid movement through a room (flux), built entirely on static, archived moments in time.

9. PermaMoment
Simple, premium, and highly scalable. It strips away the complex language to focus on the core value proposition: stretching a two-week moment out for decades.

Which of these directions feels closest to the identity you want to build for the platform?