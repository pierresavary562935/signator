
export default async function HomePage() {

  return (
    <>
      <main className="flex-1 flex flex-col p-6">
        <div className="flex justify-center items-center h-screen bg-gray-100">
          <div className="flex flex-col items-center">
            <h1 className="text-4xl font-bold">Welcome to the Signator</h1>
            <p className="text-xl">The easiest way to sign your documents</p>
            <a href="/auth/login" className="mt-6 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Login</a>
          </div>
        </div>
      </main>
    </>
  );
}