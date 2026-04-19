import React from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const ForgotPasswordPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-black p-4">
            <Card className="w-full max-w-md bg-gray-900/70 border-white/10 backdrop-blur-lg shadow-xl shadow-black/30">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-white">Forgot Password?</CardTitle>
                    <CardDescription className="text-gray-400">Enter your email and we'll send you instructions to reset it.</CardDescription>
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
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/30"
                        >
                            Send Reset Link
                        </Button>
                    </form>
                    <div className="mt-6 text-center text-sm text-gray-400">
                        Remembered your password?{' '}
                        <Link href="/login" className="text-violet-400 hover:underline">
                            Log In
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ForgotPasswordPage;
