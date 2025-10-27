import MyOnlineCvs from "../components/MyOnlineCvs";
import MyFileCvs from "../components/MyFileCvs";

const MyCvPage = () => {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-10">
      <MyOnlineCvs />
      <MyFileCvs />
    </div>
  );
};

export default MyCvPage;
