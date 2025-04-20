import { Header } from "@/components/header";

const ProtectedPageLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
    return (
        <div>
            <Header />
            <main className="min-h-screen my-25 container mx-auto">
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

export default ProtectedPageLayout;