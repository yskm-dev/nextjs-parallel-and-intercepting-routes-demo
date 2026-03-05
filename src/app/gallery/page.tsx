import { photos } from "@/lib/photos";
import Image from "next/image";
import Link from "next/link";
import css from "./page.module.css";

export default function Page() {
  return (
    <div className={css.container}>
      <ul className={css.list}>
        {photos.map((photo) => (
          <li className={css.listItem} key={photo.id}>
            <Link href={`/photo/${photo.id}`}>
              <Image src={photo.imagePath} alt={photo.title} width={1980 * 0.25} height={1080 * 0.25} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
