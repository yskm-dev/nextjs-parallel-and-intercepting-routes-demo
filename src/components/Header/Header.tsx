import Link from "next/link";
import css from "./Header.module.css";

export default function Header() {
  return (
    <header className={css.header}>
      <nav className={css.breadcrumb} aria-label="breadcrumb">
        <a href="https://yskm.dev/" className={css.breadcrumbLink}>yskm_dev</a>
        <span className={css.separator}>/</span>
        <a href="https://yskm.dev/sketch/" className={css.breadcrumbLink}>sketch</a>
        <span className={css.separator}>/</span>
        <Link href="/gallery" className={css.breadcrumbCurrent}>
          Parallel Routes &amp; Intercept Routes DEMO
        </Link>
      </nav>
    </header>
  );
}
