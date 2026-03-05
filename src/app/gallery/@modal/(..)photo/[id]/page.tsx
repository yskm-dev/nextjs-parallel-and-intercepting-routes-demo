import { Modal } from "@/components/Modal";
import type { Photo } from "@/lib/photos";
import { getPhotoById, photos } from "@/lib/photos";
import Image from "next/image";
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
  if (!photo) {
    return <div>Photo not found</div>;
  }
  return (
    <Modal>
      <div className={css.container}>
        <Image className={css.image} src={photo.imagePath} alt={photo.title} width={1980 * 0.5} height={1080 * 0.5} />
        <div className={css.info}>
          <p className={css.title}>{photo.title}</p>
          <p className={css.description}>
            {photo.description}
          </p>
        </div>
      </div>
    </Modal>
  );
}
