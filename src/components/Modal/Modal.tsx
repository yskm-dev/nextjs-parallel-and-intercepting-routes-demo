'use client';
import gsap from "gsap";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import css from "./Modal.module.css";


export function Modal({ children }: { children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLDialogElement | HTMLButtonElement>) => {
    if (e.target !== e.currentTarget) return;
    const dialog = dialogRef.current;
    const container = containerRef.current;
    if (!dialog || !container) return;
    gsap.to(dialog, { opacity: 0, duration: 0.4, onComplete: () => {
      router.back();
    } });
  }

  // Animate in
  useEffect(() => {
    const dialog = dialogRef.current;
    const container = containerRef.current;
    if (!dialog || !container) return;
    dialog.showModal();

    requestAnimationFrame(() => {
      gsap.set(dialog, { opacity: 0 });
      gsap.to(dialog, { opacity: 1, duration: 0.3, delay: 0.1 });
      gsap.set(container, { y: 100 });
      gsap.to(container, { y: 0, duration: 0.4, delay: 0.1, ease: "power4.out" });
    })
  }, []);

  return (
    <dialog className={css.wrapper} ref={dialogRef} onClick={handleClick}>
      <div className={css.container} ref={containerRef}>
        <div className={css.inner}>
          {children}
        </div>
        <button className={css.close} onClick={handleClick}>
          Close
        </button>
      </div>
    </dialog>
  );
}