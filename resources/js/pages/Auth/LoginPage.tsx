import { Link } from '@inertiajs/react';
import React from 'react';
import { Button } from '@/components/UI/Button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/UI/card';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';

const LoginPage = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 to-black p-4">
            <Card className="w-full max-w-md border-white/10 bg-gray-900/70 shadow-xl shadow-black/30 backdrop-blur-lg">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-white">
                        Welcome Back
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        Sign in to continue your journey.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div>
                            <Label htmlFor="email" className="text-gray-300">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                className="mt-1 border-gray-700 bg-gray-800/50"
                            />
                        </div>
                        <div>
                            <Label htmlFor="password" className="text-gray-300">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="********"
                                className="mt-1 border-gray-700 bg-gray-800/50"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Input
                                    id="remember-me"
                                    type="checkbox"
                                    className="mr-2 h-4 w-4 rounded border-gray-600 bg-gray-800/50 text-violet-600 focus:ring-violet-500"
                                />
                                <Label
                                    htmlFor="remember-me"
                                    className="text-gray-300"
                                >
                                    Remember me
                                </Label>
                            </div>
                            <Link
                                href="/forgot-password"
                                className="text-sm text-violet-400 hover:underline"
                            >
                                Forgot Password?
                            </Link>
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30 hover:from-violet-700 hover:to-indigo-700"
                        >
                            Log In
                        </Button>
                    </form>
                    <div className="mt-6 text-center text-sm text-gray-400">
                        Don't have an account?{' '}
                        <Link
                            href="/register"
                            className="text-violet-400 hover:underline"
                        >
                            Sign Up
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginPage;
