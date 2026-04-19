import React from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const ResetPasswordPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-black p-4">
            <Card className="w-full max-w-md bg-gray-900/70 border-white/10 backdrop-blur-lg shadow-xl shadow-black/30">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-white">Reset Password</CardTitle>
                    <CardDescription className="text-gray-400">Enter your new password below.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div>
                            <Label htmlFor="password" className="text-gray-300">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="********"
                                className="bg-gray-800/50 border-gray-700 mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="password_confirmation" className="text-gray-300">Confirm New Password</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                placeholder="********"
                                className="bg-gray-800/50 border-gray-700 mt-1"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/30"
                        >
                            Reset Password
                        </Button>
                    </form>
                    <div className="mt-6 text-center text-sm text-gray-400">
                        Go back to{' '}
                        <Link href="/login" className="text-violet-400 hover:underline">
                            Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ResetPasswordPage;
