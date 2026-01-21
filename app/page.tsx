'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full text-center"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-primary-500 rounded-2xl flex items-center justify-center shadow-lg">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        </motion.div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Questionnaire
        </h1>
        <h2 className="text-xl md:text-2xl font-semibold text-primary-600 mb-6">
          Panorama des groupes dentaires - 2026
        </h2>

        <div className="text-gray-600 mb-8 leading-relaxed text-left space-y-4 text-sm">
          <p>
            Dans le cadre d'une étude de recherche, notre objectif est de mieux comprendre les enjeux liés à la transition des médecins-dentistes d'une pratique indépendante ou d'autres modes d'exercice vers des groupes dentaires (centres ou réseaux de cabinets).
          </p>
          <p>
            Cette recherche, destinée à une publication scientifique, analyse les impacts de cette transition sur le développement professionnel, la satisfaction au travail, l'accès à la formation continue, le soutien administratif et organisationnel, ainsi que l'équilibre entre vie professionnelle et vie personnelle.
          </p>
          <p>
            Nous tenons à préciser que toutes les données collectées dans le cadre de cette étude seront traitées avec la plus grande confidentialité et qu'aucune donnée individuelle permettant d'identifier les participants ne sera extraite ou publiée.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 mb-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>~2 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Confidentiel</span>
            </div>
          </div>
        </div>

        <Link href="/survey">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full md:w-auto px-12 py-4 bg-primary-500 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/30 hover:bg-primary-600 transition-colors text-lg"
          >
            Commencer
          </motion.button>
        </Link>
      </motion.div>
    </main>
  );
}
