import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Card } from 'primereact/card';
import { Store } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn(email, password);

    if (error) {
      setError('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
    } else {
      navigate('/');
    }

    setLoading(false);
  };

  const header = (
    <div className="flex justify-center pt-6 mb-2">
      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
        <Store className="w-7 h-7 text-white" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card header={header} className="w-full max-w-md shadow-lg" title="NEURA ERP" subTitle="Ingresa a tu cuenta">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-medium text-gray-700">Email</label>
            <InputText
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="font-medium text-gray-700">Contraseña</label>
            <Password
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              required
              feedback={false}
              toggleMask
              className="w-full"
              inputClassName="w-full"
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <Button
            label={loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            type="submit"
            icon="pi pi-sign-in"
            loading={loading}
            className="w-full mt-2"
          />
        </form>
      </Card>
    </div>
  );
};

export default Login;