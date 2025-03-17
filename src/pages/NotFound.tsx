
const NotFound = () => {
    return (
        <div className="flex flex-col h-screen bg-black text-white justify-center items-center p-4">
            <div className="flex flex-col items-center max-w-md w-full">
                <div className="mb-8">
                    <img src="src\assets\logo.webp" alt="Logo" width="120" height="60" />
                </div>


                <div className="bg-[#243333] rounded-lg p-8 w-full text-center shadow-lg border border-gray-800">
                    <h1 className="text-6xl md:text-8xl font-bold text-[#25d368] mb-4">404</h1>
                    <div className="h-1 w-16 bg-green-500 mx-auto mb-6"></div>
                    <p className="text-xl md:text-2xl mb-8">Página no encontrada</p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="bg-green-500 hover:bg-green-600 text-black font-medium py-2 px-6 rounded-md transition duration-300"
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;