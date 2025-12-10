import React, { useState, useEffect } from 'react';
import { User, Mail, Lock} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import axios from 'axios';

import {motion, AnimatePresence} from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const api = import.meta.env.VITE_API_URL;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const {login} = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try{
      await login(email, password)
    } catch (error) {
      setIsLoading(false)
    }
  };
 
  const handleforget = (e: React.FormEvent) =>{
    e.preventDefault();
    if (email){
      axios.post(`${api}/forgot-password`, {
        email: email, 
      }).then((resp) => {
        if (resp.data.message){
          setError(resp.data.message)
        }
      })
    }
  }

 
  useEffect(() => {
    if (error && error !== "Va rugam sa verificati email-ul inainte de a va loga") {
      const timeout = setTimeout(() => {
        setError('');
      }, 3000); // 3 seconds

      return () => clearTimeout(timeout); // Clear timeout on unmount or next error
    }
  }, [error]);
  return (
    <motion.div className="min-h-screen flex items-center justify-center px-4"
      initial={{opacity: 0, y: 10}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.4}}
    >
      
      <div className="max-w-md w-full bg-slate-900 rounded-xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-blue-200">
            Login
          </h1>
          <p className="text-gray-400 mt-2">
            Accesează dashboard-ul pentru ati gestiona echipa
          </p>
        </div>

             <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-20 right-4 z-50 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-lg max-w-md"
          >
            <p className="text-sm text-yellow-700">
              <strong>Info:</strong> {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    


        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-200 text-black font-bold"
                placeholder={`nume@example.com`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Parola
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-blue-200 text-black font-bold"
                placeholder={`********`}
              />
            </div>
          </div>
       
          <button
            type="submit"
            disabled={isLoading}
            className=" bg-blue-200 text-black font-bold w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Se conectează...' : 'Conectare'}
          </button>
        </form>

      </div>
    </motion.div>
  );
}