# 🥷 Urban Ninja

> **Den ultimative navigations-app til byens skygger.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status](https://img.shields.io/badge/Status-Active-success.svg)]()
[![Platform](https://img.shields.io/badge/Platform-PWA%20%7C%20Web-blue.svg)]()

Urban Ninja er ikke bare en GPS; det er en fuldt udstyret PWA (Progressive Web App) designet til den moderne by-udforsker. Med avancerede funktioner som Augmented Reality (AR), stemmestyring, og en dedikeret "Ninja Mode", forvandler denne app din daglige pendling til en mission.

---

## ✨ Features

Urban Ninja er pakket med funktioner, du ikke finder i en standard kort-app:

### 🕶️ Ninja Modes
*   **Ninja Mode (N)**: Skifter interfacet til et mørkt, højteknologisk tema med neon-accenter.
*   **Stealth Mode (S)**: Gør navigationen ultra-diskret. Kortet dæmpes, indtil du bevæger musen.
*   **Night Vision (V)**: Aktiverer et grønt filter optimeret til natlige operationer.

### 🧭 Avanceret Navigation
*   **Aggressive Route (A)**: Undgår motorveje for hurtigere bykørsel og "smart" navigation gennem trafikken.
*   **Urban Ninja Mode (U)**: Den ultimative genvejs-app! Ignorerer byplanlægning og finder ALLE mulige genveje - grusveje, parkeringspladser, lokale stier som kun de lokale kender. Prioriterer dig over byplanlægningen!
*   **EXTREME Mode (X)**: 🔥 Radikal routing der ignorerer ALLE hastigheder, restriktioner og trafikforhold. Sætter alle vejtyper til samme hastighed og vælger udelukkende korteste fysiske distance. Fjerner alle "penalty" for vejskift og access restriktioner. ⚠️ **Advarsel:** Dette er konceptuel navigation - følg altid gældende love og regler!
*   **Trafik Integration (T)**: 🚦 Systemet henter og analyserer trafikdata fra Mapbox. Urban Ninja kan vælge ruter der ignorerer trafikpropper for ultimativ hastighed, eller bruge trafikdata til smartere beslutninger.
*   **Predictive Routing (P)**: AI-inspireret logik der foreslår ruteændringer baseret på simulerede trafikmønstre og tidspunkt på dagen.
*   **AR Overlay (O)**: Augmented Reality visning der lægger Points of Interest (POI) og navigationspile oven på virkeligheden (simuleret i browser).

### 🔍 Søgefunktioner
*   **Autocomplete**: Skriv adresse og få forslag automatisk mens du skriver
*   **Manuel søgning**: Klik 🔍 knappen eller tryk Enter for at søge efter specifikke adresser
*   **GPS lokation**: "FIND MIG" knappen finder automatisk din nuværende position
*   **Dansk support**: Alle søgninger optimeret til danske adresser og steder

### 🤖 Tech Integration
*   **Voice Commands (C)**: Hænderfri betjening. Sig *"Urban Ninja stealth"* eller *"Urban Ninja find mig"*.
*   **Apple Integration (Y)**: Simulerer CarPlay mode og integration med Siri/Apple Maps.
*   **Social Ninja (Z)**: Find "buddies" i nærheden og del din rute krypteret.
*   **Offline Mode (F)**: Cacher ruter og kort-tiles så du kan navigere uden internetforbindelse.

### 🎨 Visuelle Effekter
*   **Cyberpunk FX (X)**: Matrix-regn, partikel-eksplosioner og glitch-effekter for den rette stemning.
*   **Pulsating GPS**: Visuel feedback når din position opdateres.

---

## ⌨️ Tastaturgenveje

For den hurtigste betjening, brug følgende genveje på desktop:

| Tast | Funktion |
| :---: | :--- |
| **N** | Toggle Ninja Mode |
| **U** | Toggle Urban Ninja Mode (alle genveje!) |
| **X** | Toggle EXTREME routing (ignorerer ALLE restriktioner) |
| **T** | Opdater trafikdata manuelt |
| **C** | Gendan kontrolpanel hvis det forsvinder |
| **Y** | Test routing med København koordinater |
| **M** | Manuel mission mode (spring over routing) |
| **L** | Find min position (Locate) |
| **A** | Toggle Aggressive Route |
| **R** | Nulstil Rute (Reset) |
| **G** | Åbn rute i Google Maps |
| **S** | Toggle Stealth Mode |
| **V** | Toggle Night Vision |
| **T** | Toggle Ninja Alerts |
| **C** | Toggle Voice Commands |
| **P** | Toggle Predictive Routing |
| **O** | Toggle AR Overlay |
| **F** | Toggle Offline Mode |
| **Z** | Toggle Social Mode |
| **Y** | Toggle Apple Mode |
| **X** | Trigger Cyberpunk Effects |
| **H** | Vis Hjælp |

---

## 🚀 Kom i Gang

### Forudsætninger
*   En moderne webbrowser (Chrome, Firefox, Safari, Edge).
*   En lokal webserver (anbefales for at PWA og Service Workers fungerer korrekt).

### Brug af appen
1. **Indtast adresser**: Skriv direkte i adressefelterne - vælg fra forslag eller skriv frit (automatisk geocoding)
2. **Manuel søgning**: Klik 🔍 for at søge efter specifikke adresser
3. **GPS lokation**: Klik "FIND MIG" for automatisk at finde din position
4. **Vælg hacks**: Aktiver forskellige modes som Ninja Mode eller Urban Ninja
5. **Trafik opdatering**: Tryk **T** for at opdatere trafikdata manuelt
6. **Start mission**: Klik "START MISSION" - koordinater findes automatisk, trafik tages i betragtning
7. **Navigation**: Følg kortet og instruktionerne med trafikbevidste ruter
8. **Hvis kontrolpanel forsvinder**: Klik ⚠️ knappen i øverste venstre hjørne eller tryk **C** for at gendanne det

### Installation & Kørsel

1.  **Hent koden:**
    Download eller klon dette repository til din computer.

2.  **Start en lokal server:**
    For at få fuldt udbytte af funktionerne (især Service Workers og geolokation), bør appen køres via en server og ikke bare åbnes som en fil.

    Hvis du har Python installeret:
    ```bash
    # Python 3
    python -m http.server 8000
    ```

    Eller med Node.js (`http-server`):
    ```bash
    npx http-server .
    ```

3.  **Åbn i browseren:**
    Gå til `http://localhost:8000` (eller den port din server bruger).

### Konfiguration (Mapbox)
Appen bruger Mapbox til kortdata og routing. Koden kommer med en demo-token, men til seriøs brug bør du oprette din egen:

1.  Opret en konto på [Mapbox.com](https://www.mapbox.com/).
2.  Generer en ny **Public Access Token**.
3.  Åbn `app.js` og find linjen:
    ```javascript
    const MAPBOX_TOKEN = 'pk.eyJ...'; // Indsæt din token her
    ```
4.  Udskift værdien med din egen token.

---

## 🛠️ Teknologier

*   **HTML5 & CSS3**: Responsivt design med CSS Grid/Flexbox og animationer.
*   **JavaScript (ES6+)**: Vanilla JS uden tunge frameworks.
*   **Leaflet.js**: Open-source bibliotek til interaktive kort.
*   **Mapbox GL / Routing API**: Leverer kortdata og trafikbaseret rutevejledning.
*   **Web APIs**:
    *   *Geolocation API* til positionering.
    *   *Web Speech API* til stemmestyring.
    *   *Service Workers* til offline funktionalitet (PWA).
    *   *Local Storage* til at gemme indstillinger og stats.

---

## 📱 Mobil & PWA

Urban Ninja er designet som en **Progressive Web App**. Det betyder, at du kan installere den på din telefon:

1.  Åbn siden i Chrome (Android) eller Safari (iOS).
2.  Vælg "Føj til startskærm" (Add to Home Screen).
3.  Appen vil nu ligge som et ikon på din telefon og starte i fuld skærm uden browser-bar.

---

## 🤝 Bidrag

Har du idéer til nye features? En "Samurai Mode"? Eller måske bedre partikel-effekter?

1.  Fork projektet.
2.  Opret en feature branch (`git checkout -b feature/AmazingNinjaSkill`).
3.  Commit dine ændringer (`git commit -m 'Add Amazing Ninja Skill'`).
4.  Push til branchen (`git push origin feature/AmazingNinjaSkill`).
5.  Opret en Pull Request.

---

## 📄 Licens

Dette projekt er distribueret under **MIT Licensen**. Se `LICENSE` filen for flere detaljer.

---

<div align="center">
  <sub>Built with 💻 and 🥋 by the Urban Ninja Team</sub>
</div>
