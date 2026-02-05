
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-background min-h-screen py-8 sm:py-16">
        <main className="container mx-auto max-w-3xl px-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-headline">Politică de Confidențialitate</CardTitle>
                    <p className="text-sm text-muted-foreground">Ultima actualizare: 2 Iunie 2024</p>
                </CardHeader>
                <CardContent className="space-y-6 text-foreground/90">
                    <section>
                        <h2 className="text-xl font-semibold mb-2">1. Introducere</h2>
                        <p>
                            Bun venit la Daily Planner Pro! Ne angajăm să protejăm confidențialitatea datelor dumneavoastră. Această Politică de Confidențialitate explică ce informații colectăm, cum le folosim și care sunt drepturile dumneavoastră.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">2. Informațiile pe care le Colectăm</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                <strong>Informații de Cont:</strong> Când vă creați un cont, colectăm adresa de e-mail și numele pe care îl furnizați. Dacă alegeți să vă conectați ca oaspete (anonim), un identificator unic este generat de Firebase Authentication, fără a colecta date personale.
                            </li>
                            <li>
                                <strong>Date Academice și de Utilizare:</strong> Colectăm datele pe care le introduceți în aplicație, cum ar fi: materiile, orarul, temele (descriere, termene limită) și preferințele de aspect (teme de culori).
                            </li>
                             <li>
                                <strong>Evenimente Personale:</strong> Colectăm date despre evenimentele personale pe care le adăugați, cum ar fi titlul, data, și descrierea acestora (de exemplu: antrenamente, întâlniri, alte activități non-școlare).
                            </li>
                            <li>
                                <strong>Date Tehnice (prin Firebase):</strong> Putem colecta informații despre dispozitiv și utilizare în mod anonim pentru a îmbunătăți performanța și stabilitatea aplicației.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">3. Cum Folosim Informațiile</h2>
                        <p>
                            Folosim informațiile colectate pentru a:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>A oferi, menține și îmbunătăți funcționalitățile aplicației (organizarea temelor și evenimentelor).</li>
                            <li>A vă personaliza experiența.</li>
                            <li>A sincroniza datele între dispozitivele dumneavoastră (dacă sunteți autentificat cu un cont).</li>
                            <li>A vă oferi suport tehnic, dacă este cazul.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">4. Partajarea Datelor</h2>
                        <p>
                            Nu vindem și nu partajăm datele dumneavoastră personale cu terțe părți în scopuri de marketing. Datele sunt stocate folosind serviciile Firebase (Google), care acționează ca procesor de date și oferă garanții de securitate robuste.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">5. Securitatea Datelor</h2>
                        <p>
                            Luăm securitatea datelor în serios. Ne bazăm pe infrastructura securizată a Google Firebase pentru a proteja informațiile dumneavoastră împotriva accesului neautorizat.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">6. Drepturile Dumneavoastră</h2>
                        <p>
                            Aveți dreptul de a accesa, modifica și șterge datele (teme, materii, evenimente) direct din aplicație. De asemenea, aveți opțiunea de a reseta complet contul din meniul de Setări, acțiune care va șterge ireversibil toate datele asociate.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">7. Modificări ale Politicii</h2>
                        <p>
                            Putem actualiza ocazional această Politică de Confidențialitate. Vă vom notifica despre orice modificare prin publicarea noii politici pe această pagină.
                        </p>
                    </section>
                    
                    <section>
                        <h2 className="text-xl font-semibold mb-2">8. Contact</h2>
                        <p>
                            Dacă aveți întrebări legate de această politică, ne puteți contacta la adresa de e-mail lucagrigore28@gmail.com.
                        </p>
                    </section>
                     <div className="pt-4 text-center">
                        <Link href="/" className="text-primary hover:underline">Înapoi la aplicație</Link>
                    </div>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
