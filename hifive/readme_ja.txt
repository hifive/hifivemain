hifiveMain
----------------------------------------------
hifive�̃R�A�����̊J���p�ł��B
�����ł�hifive�̃����[�X�ŁA�J���ŁACSS�AEJS�̃r���h���@���L�q���܂��B

1.���|�W�g���̃N���[��
  $ git clone git@github.com:hifive/hifivemain.git

2.Apache ivy�𗘗p��hifive�r���h�ɕK�v�ȃ��C�u������ǉ�
�@�@hifive/ivy_build.xml��resolve�^�[�Q�b�g�����s���܂��B

�@�@-�R�}���h���C������
   $ cd hifive
   $ ant -buildfile ivy_build.xml
   
  -IDE(eclipse)����
   hifive�v���W�F�N�g���C���|�[�g -> hifive/ivy_build.xml���E�N���b�N -> ���s -> Ant�r���h

3.hifive�r���h�����s
�@�@hifive/build_for_js.xml��build�^�[�Q�b�g�����s���܂��B

�@�@-�R�}���h���C������
   $ cd hifive
   $ ant -buildfile build_for_js.xml
   
  -IDE(eclipse����)
   hifive/build_for_js.xml���E�N���b�N -> ���s -> Ant�r���h
   
�@�@�o�[�W���������(�C��)�����
�@�@hifive/src/main/webapp/release/
    ejs.js
    h5.css
    h5.dev.js
    h5.js
     ����������܂��B