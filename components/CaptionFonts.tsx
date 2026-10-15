const editorFonts =
  'Anton&family=Bangers&family=Bebas+Neue&family=Black+Han+Sans&family=Bowlby+One+SC&family=Bungee&family=Caveat:wght@700&family=Cinzel:wght@700&family=Cormorant+Garamond:ital,wght@1,700&family=Courier+Prime:wght@700&family=DM+Serif+Display&family=Dancing+Script:wght@700&family=Inter:wght@700;900&family=Kalam:wght@700&family=Manrope:wght@800&family=Montserrat:wght@800;900&family=Outfit:wght@800;900&family=Pacifico&family=Permanent+Marker&family=Playfair+Display:ital,wght@1,800&family=Plus+Jakarta+Sans:wght@800&family=Poppins:wght@800;900&family=Rubik+Mono+One&family=Share+Tech+Mono&family=Space+Grotesk:wght@700&family=Special+Elite&family=Syne:wght@800&family=Titan+One&family=VT323&family=Yatra+One';
const previewFonts =
  'Anton&family=Bebas+Neue&family=Inter:wght@900&family=Montserrat:wght@800;900&family=Outfit:wght@800;900';

export default function CaptionFonts({
  editor = false,
  templates = false,
}: {
  editor?: boolean;
  templates?: boolean;
}) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href={`https://fonts.googleapis.com/css2?family=${editor ? editorFonts : previewFonts + (templates ? '&family=Playfair+Display:wght@800&family=Poppins:wght@800;900' : '')}&display=swap`}
      />
    </>
  );
}
