import React from 'react'
import {Link} from 'react-router-dom'

const Notfound = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-base-200">
            <div className="text-center max-w-md">
                <h1 className="text-9xl font-bold text-error">404</h1>
                <div className="mt-4 mb-8">
                    <h2 className="text-3xl font-bold mb-2">Oops! Page not found</h2>
                    <p className="text-base-content/70">The page you are looking for doesn't exist or has been moved.</p>
                </div>
                <Link to="/" className="btn btn-primary">Go back home</Link>
            </div>
        </div>
    )
}

export default Notfound