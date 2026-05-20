# Frontend Refactor Plan v2 — Assistant Réussite

## 1. Comprehensive Audit

### 1.1 Architecture & Tech Stack
- **Current Structure**: Flat `src/` directory. Not modular. Mixed logic and UI.
- **Current Stack**: React 19, Vite, Tailwind v4, Zustand, Axios.
- **Required Stack (Missing)**: 
    - **TanStack Query**: For all server-state management.
    - **Framer Motion**: For micro-interactions and transitions.
    - **React Hook Form + Zod**: For robust schema-based validation.
    - **Vite PWA**: For installability and offline support.
- **Strict TS**: Current codebase has some loose types; must move to strict-mode.

### 1.2 Design System Compliance (DESIGN.md)
- **Typographic Mismatch**: Current uses JetBrains Mono; must strictly prioritize Berkeley Mono (with JetBrains as fallback).
- **Aesthetic Mismatch**: Current uses shadows and generic rounded corners. `DESIGN.md` requires **ZERO shadows**, **ZERO gradients**, and a strict **4px radius** for interactive elements only.
- **Iconography**: Must replace all SVGs with ASCII-bracket markers `[+]`, `[-]`, `[x]`, `+`, `−`.
- **Canvas**: Must use the warm cream canvas (#fdfcfc) globally.

---

## 2. Refactor Goals & Success Criteria
- **100% DESIGN.md Compliance**: Verifiable via visual audit and zero-shadow policy.
- **Mobile-First Priority**: Primary navigation and all layouts optimized for 375px-414px width.
- **Enterprise Architecture**: Scalable, feature-based modular structure.
- **PWA Excellence**: Lighthouse score > 90 for Progressive Web App.

---

## 3. Implementation Plan

### Phase 1: Foundation (Design System & Core Architecture)
- [ ] **Folder Structure Realignment**:
    ```text
    src/
      app/              # Global providers, providers/
      routes/           # Route definitions & guards
      layouts/          # Shared layout templates
      pages/            # Page entry points
      components/       # UI (Atomic), forms, chat, dashboard, tables, analytics
      features/         # Auth, Chat, Dashboard, Quiz, Upload
      services/         # API clients (TanStack Query hooks)
      hooks/            # Global custom hooks
      store/            # Zustand stores
      theme/            # Design tokens (colors.ts, spacing.ts)
      styles/           # Global CSS, tailwind.css
      providers/        # Context providers (Auth, Theme, Query)
      lib/              # Shared library instances (Axios, Supabase)
      types/            # Global TS types
      utils/            # Helper functions
      constants/        # Config constants
    ```
- [ ] **Design Tokens & Theme Provider**:
    - Centralize `DESIGN.md` tokens in `tailwind.config.ts`.
    - Implement `ThemeProvider` for dynamic school branding (Logo/Primary Color).
- [ ] **Base UI Kit**: Build Button, Input, Select, Badge, ASCII Brackets, and Dividers from scratch.

### Phase 2: Feature Migration & Page Refactoring
- [ ] **Landing Page**: Hero TUI mockup, school code search, multi-tenant greeting.
- [ ] **Auth Feature**: Login (Student/Professor) with strict terminal aesthetic.
- [ ] **Chat Feature (Premium)**:
    - Streaming message support.
    - ASCII-style loaders & scroll behavior.
    - Three modes: Tutorat, Quiz, Simulateur Examen.
- [ ] **Dashboard Feature**:
    - Stats Cards (Zero shadows, ASCII charts).
    - Advanced Tables (Mobile-adaptive).
    - Analytics (Zustand + TanStack Query).

### Phase 3: PWA, Security & Performance
- [ ] **PWA Implementation**:
    - `manifest.json`, Service Worker (Cache-first for assets).
    - Splash screen & Adaptive icons.
    - Offline fallback page.
- [ ] **Security**: Route guards, secure token storage, Zod validation for all inputs.
- [ ] **Performance**: Route-based code splitting, lazy loading, bundle size optimization.

---

## 4. White-Label Architecture
- **Branding Injection**: App reads `school.primary_color` and `school.logo_url` from `AuthContext`.
- **CSS Variables**: `ThemeProvider` updates `--color-accent` and `--color-logo-url` dynamically.
- **Fallback**: Defaults to `DESIGN.md` OpenCode palette when no school is selected.

---

## 5. Verification Checklist
- [ ] **TypeScript**: Strict mode enabled, zero `any`.
- [ ] **UI Audit**: Zero box-shadows, zero linear-gradients in CSS.
- [ ] **Aesthetics**: All text in Berkeley Mono stack.
- [ ] **PWA**: Lighthouse PWA score 100%.
- [ ] **Accessibility**: Keyboard focus visible, ARIA labels on all interactive elements.
- [ ] **Mobile**: 100% functional on 320px width (iPhone SE).
