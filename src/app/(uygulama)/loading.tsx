/**
 * Sayfa geçişlerinde anında görünen iskelet: dokunuşun alındığı hemen belli
 * olsun, veri gelene kadar kullanıcı başka bir yere basmasın.
 */
export default function Yukleniyor() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col lg:max-w-6xl" aria-busy="true" aria-label="Yükleniyor">
      <div className="yukleme-cizgisi fixed inset-x-0 top-0 z-50 h-1 bg-vurgu" />
      <div className="flex min-h-16 items-center border-b-2 border-cizgi px-4 lg:px-8">
        <div className="h-6 w-32 animate-pulse rounded-lg bg-yuzey" />
      </div>
      <div className="flex flex-col gap-4 px-4 pt-4 lg:px-8">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-yuzey" />
        <div className="h-16 animate-pulse rounded-2xl bg-yuzey" />
        <div className="h-24 animate-pulse rounded-2xl bg-yuzey" />
        <div className="h-24 animate-pulse rounded-2xl bg-yuzey" />
        <div className="h-24 animate-pulse rounded-2xl bg-yuzey" />
      </div>
    </div>
  );
}
