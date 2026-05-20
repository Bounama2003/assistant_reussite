Design et foncƟonnnalité ProducƟon-Ready Assistant Réussite

1. Landing Page__ Bouton demander un demo
**** Champ texte pour renseigner le code ecole avec un bouton acceder**** Une fois l’uƟlisateur clique sur acceder du landing page on le redirige dans

l’espace lead 2. Espace lead

**** Formulaire d’inscripƟon lead (nom,prenom,numero_telephone =>unique,classe (3e,2nd, 1ere et terminale))

**** Bouton créer mon compte**** Lien permeƩant à un eleve déjà inscrit d’acceder au formulaire de connexion

de l’espace eleve**** Une fois le compte lead créé l’utilisateur doit être redirigé au chat et peut

poser des quesƟons à specifiques à l’ia (reglements interieur de l’ecole,informaƟons generaux ex inscripƟons , contacts de l’ecole,directeur

fondateur et directeur actuel)**** Il ne doit pas avoir acces au contenus pedagogiques ex cours, supports,

exercices ect**** Exporter discussions vers pdf

**** Bouton se deconnecter redirige vers espace lead3. Espace èleve

**** Renseigne un formulaire de connexion(numero_telephone uniquecommençant par +221 + 8 caracteres 13 au total obligatoirement, mot de

passe définit par l’admin de l’ecole.**** L’eleve accede au chat et peut avoir acces aux cours de sa classe si le cours ne

fait pas parƟe du programme de sa classe l’ia lui dira ça clairement**** Il a acces à tous les contenus qu’un lead peut consulter

**** L’ia filtre les requêtes par annee scolaire du pdf,pour répondre à l’eleve enmenƟonnant(la classe,professeur cours et module)

**** Chaque ecole a ses propres contenus d’où la necessite de filtrer par school_id**** L’ia aura trois modes :

-Tutorat(mentor) -Quiz, exercices et QCM

- mode simulateur d’examen noté/20 Propose des exercices en se basant sur les exercies reçus en pdf s’il existe
sinon proposer des exercices sur les cours reçus. Il peut aussi donner les correcƟons s’il les a reçus

**** L’ ia fourni auusi des recommandaƟons à l’eleve et suggesƟons des points àrevoir en analysant les points faible de l’eleve

**** L’ia doit aussi répondre avec precision et clarté basé sur les documents fournis

**** Ne genere pas ses propres connaissances et evite les hallucinaƟons**** L’eleve peut exporter les discussions en pdf ou txt

**** GesƟon des sessions par l’eleve (CRUD) + export**** Un bouton se deconnecter redirige dans formulaire connexion espace eleve

4. Espace Admin**** Chaque ecole a son propre admin
**** Admin se connecte avec un clé admin auto-generé lors de la creaƟon del’ecole par le superadmin

**** Admin gere les leads et eleves**** ConverƟt les leads en eleve

**** Consulte des staƟsƟquesEx : nombre de documents telechargés,nombre de messages envoyé par

jours, nombres de leads, plus des graphiques visuels interacƟfs et diagramme les maƟeres ou les eleves rencontren plus de probleme selon le nombre de

requêtes par maƟere par classe**** Upload des documents pdf (anglais, maths,français,HG,philosophie,pc,

informaƟons generales et règlement interieur**** GesƟon des documents CRUD

**** Chaque document est lié à une classe, annees scolaire et professeursobligatoirement sauf pour les informaƟons generaux et reglements interieurs

qui requiert uniquement annee scolaire**** Exporter liste des leads et des eleves en pdf ou excel

**** Btn se deconnecter redirige l’admin vers landing page page d’accueil5. Espace super admin

**** Il se connecte avec son secret du .env**** GesƟon des ecoles CRUD

**** Suspension et acƟvaƟon ecole**** Recherche ou filtre par id_ecole ou nom ecole

**** RéiniƟaliser clé admin d’un ecole**** Voir clé admin ecole

**** VisualisaƟon staƟsƟques globaux du syteme

Remarque : La majeure parƟe des endpoints sont déjà disponible dans le dossier backend fastapi vous pouvez le consulter et voir s’il ya des foncƟonnalites non implementés vous les

ajoutez. Le front utlise le framework reflex.

= L’applicaƟon doit être un pwa installable mobile first et adaptable sur differntes teaille d’ecran (ios,android)

- Chaque etablissement doit disposer de son propre design couleurs et logo (white labelling) defeinit par les champs couleur et logo url de la table schools de supabase

- L’applicaƟon doit être producƟon-ready déployé sur hugginface et disponible sur le marché
