import type { Photo } from "@/lib/photos";
import { getAdjacentPhotoIds, getPhotoById, photos } from "@/lib/photos";
import Image from "next/image";
import Link from "next/link";
import css from "./page.module.css";

export function generateStaticParams() {
  return photos.map((photo) => ({ id: photo.id }));
}

export const dynamicParams = false;

type Props = {
  params: {
    id: string;
  };
}

export default async function Page({ params }: Props) {
  const { id } = params;
  const photo: Photo | undefined = getPhotoById(id);
  const adjacentPhotoIds = getAdjacentPhotoIds(id);
  if (!photo) {
    return <div>Photo not found</div>;
  }
  return (
    <div className={css.container}>
      <Image className={css.image} src={photo.imagePath} alt={photo.title} width={1980 * 0.5} height={1080 * 0.5} />
      <div className={css.info}>
        <p className={css.title}>{photo.title}</p>
        <p className={css.description}>
          {photo.description}
        </p>
      </div>
      <div className={css.footer}>
        <div className={css.navigation}>
          {adjacentPhotoIds.prevId && <div className={css.prev}><Link href={`/photo/${adjacentPhotoIds.prevId}`}>Previous</Link></div>}
          {adjacentPhotoIds.nextId && <div className={css.next}><Link href={`/photo/${adjacentPhotoIds.nextId}`}>Next</Link></div>}
        </div>
        <div className={css.back}>
        <Link href="/gallery">Back to gallery</Link>
        </div>
      </div>
    </div>
  );
}
