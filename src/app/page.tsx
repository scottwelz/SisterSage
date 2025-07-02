import Header from '@/components/header';
import InventoryList from '@/components/inventory-list';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <InventoryList />
      </main>
    </div>
  );
}
