# Forge
<img width="1856" height="960" alt="Forge homepage" src="https://github.com/user-attachments/assets/843d0c79-0176-468f-a387-be2dc23e33c4" />

**A highly interactive developer portfolio built with fluid responsive design, scroll-driven animations, WebGL effects, and custom UI systems.**

---

## 🛠 Tech Stack

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge\&logo=next.js\&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge\&logo=react\&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge\&logo=typescript\&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge\&logo=tailwind-css\&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge\&logo=greensock\&logoColor=black)
![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge\&logo=pnpm\&logoColor=white)

**Also:** ScrollTrigger · WebGL · Turbopack · Fluid Design System

---

## 📖 About

Forge is my personal developer portfolio built around interactive storytelling and motion.

Instead of using a traditional static portfolio layout, the site combines scroll-driven animations, WebGL visuals, a PC frame sequence, interactive skill sections, music controls, and custom navigation.

The project also uses a custom fluid design system where typography and spacing scale continuously between different screen sizes instead of relying heavily on responsive breakpoints.

---

## ✨ Core Features

* **Scroll-Driven Animations** — GSAP and ScrollTrigger power the major interactive sections and transitions.
* **PC Sequence Experience** — A pinned canvas animation uses image sequences and scroll progress to create an interactive hardware showcase.
* **WebGL Visual Effects** — Custom fluid simulation provides atmospheric backgrounds, haze, and interactive visual effects.
* **Fluid Responsive Design** — Typography and spacing scale smoothly using CSS `clamp()` between 320px and 1440px.
* **Interactive Skills Section** — Skills are presented through animated hexagonal elements connected to the site's visual theme.
* **Custom Page Navigation** — Includes a draggable page timeline and navigation system for moving through portfolio sections.
* **Music Player** — A fixed music interface provides playlist, playback, and seek controls.

---

## ⚙️ How It Works

The application is built with **Next.js 16**, **React 19**, and strict **TypeScript** using the App Router.

**Tailwind CSS v4** handles styling through CSS-based theme tokens, including custom typography, spacing, and semantic colour variables.

Most scroll interactions are controlled through **GSAP ScrollTrigger**, which coordinates section transitions, pinned elements, animation progress, and the PC image sequence.

The WebGL fluid system provides visual effects for sections such as the Projects interlude and atmospheric overlays.

The codebase is organised into dedicated components and libraries for navigation, animations, music, projects, skills, and visual effects to keep each system independent and maintainable.

---

## 📌 Project Status

* ✅ Core portfolio layout and design system
* ✅ Fluid typography and spacing system
* ✅ GSAP scroll animation system
* ✅ PC canvas sequence
* ✅ WebGL fluid effects
* ✅ Interactive skills section
* ✅ Custom page timeline navigation
* ✅ Music player
* 🚧 Continuing animation and performance improvements

---

## 🔮 What's Next

* Improve mobile performance for heavier visual effects
* Continue refining the PC scroll sequence
* Expand project presentation sections
* Improve animation timing and transitions
* Add more interactive visual experiments
