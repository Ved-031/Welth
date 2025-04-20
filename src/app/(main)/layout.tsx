import { Header } from "@/components/header";

const MainLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
    return (
        <div>
            <Header />
            <main className="min-h-screen">
                {children}
            </main>
            <footer className="bg-blue-50 py-12">
                <div className="container mx-auto px-4 text-center text-gray-600">
                    <p>Made with ❤️ by Ved</p>
                </div>
            </footer>
        </div>
    )
}

export default MainLayout;