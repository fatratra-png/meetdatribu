"use client";

// Petit script qui pose le thème mémorisé AVANT le premier affichage
// (sinon la page clignoterait du sombre vers le clair).
// Astuce : côté serveur c'est un vrai <script> ; côté navigateur React le
// rend en « text/plain » pour ne pas tenter de le ré-exécuter (et ne pas
// afficher d'avertissement lors d'un changement de langue).
const code = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
}
