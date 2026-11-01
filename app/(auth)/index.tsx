import { Redirect } from 'expo-router';

/** Entry for signed-out users (the route gate lands here at "/"): go straight to Sign in. */
export default function AuthIndex() {
  return <Redirect href="/login" />;
}
