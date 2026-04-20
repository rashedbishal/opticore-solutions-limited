import React from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const LoginPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-black p-4">
            <Card className="w-full max-w-md bg-gray-900/70 border-white/10 backdrop-blur-lg shadow-xl shadow-black/30">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-white">Welcome Back</CardTitle>
                    <CardDescription className="text-gray-400">Sign in to continue your journey.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div>
                            <Label htmlFor="email" className="text-gray-300">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                className="bg-gray-800/50 border-gray-700 mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="password" className="text-gray-300">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="********"
                                className="bg-gray-800/50 border-gray-700 mt-1"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Input id="remember-me" type="checkbox" className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-600 rounded mr-2 bg-gray-800/50" />
                                <Label htmlFor="remember-me" className="text-gray-300">Remember me</Label>
                            </div>
                            <Link href="/forgot-password" className="text-sm text-violet-400 hover:underline">
                                Forgot Password?
                            </Link>
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/30"
                        >
                            Log In
                        </Button>
                    </form>
                    <div className="mt-6 text-center text-sm text-gray-400">
                        Don't have an account?{' '}
                        <Link href="/register" className="text-violet-400 hover:underline">
                            Sign Up
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginPage;
