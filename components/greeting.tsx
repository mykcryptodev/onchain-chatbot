import { motion } from 'framer-motion';
import { useActiveAccount, useSocialProfiles } from 'thirdweb/react';
import { useMemo } from 'react';
import { client } from '@/providers/Thirdweb';

export const Greeting = () => {
  const account = useActiveAccount();
  const { data: socialProfiles } = useSocialProfiles({
    client,
    address: account?.address,
  });

  const firstProfileWithName = useMemo(() => {
    return socialProfiles?.find((profile) => profile.name);
  }, [socialProfiles]);

  return (
    <div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-semibold"
      >
        gm, {!firstProfileWithName?.name ? 'degen' : firstProfileWithName.name}!
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-2xl text-zinc-500"
      >
        what do you want to yap about?
      </motion.div>
    </div>
  );
};
