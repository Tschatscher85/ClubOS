import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { AnmeldeFormular } from '@/components/auth/anmelde-formular';

export default function AnmeldenPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">ClubOS</CardTitle>
        <CardDescription>
          Melden Sie sich mit Ihrem Vereinskonto an
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AnmeldeFormular />
      </CardContent>
    </Card>
  );
}
